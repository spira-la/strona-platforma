import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import type {
  YouTubeVideoDto,
  YouTubeRSSResponseDto,
} from './dto/youtube-video.dto.js';

interface CachedResponse {
  data: YouTubeRSSResponseDto;
  cachedAt: number;
}

interface RssFeedEntry {
  'yt:videoId'?: string;
  id?: string;
  title?: string;
  published?: string;
  updated?: string;
  'media:group'?: {
    'media:description'?: string;
    'media:community'?: {
      'media:statistics'?: {
        '@_views'?: string;
      };
    };
  };
}

interface RssFeed {
  entry?: RssFeedEntry | RssFeedEntry[];
  author?: { name?: string };
  title?: string;
}

interface ParsedXml {
  feed?: RssFeed;
}

/**
 * YouTube playlist prefixes for filtering content:
 * - UU:   All uploads (default)
 * - UULF: Long-form videos only (excludes Shorts)
 * - UULV: Live streams and past broadcasts only
 * - UUSH: Shorts only
 */
const PLAYLIST_PREFIX = 'UULF'; // Long-form videos only, excludes Shorts

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  // In-memory cache for RSS responses (TTL: 1 hour)
  private cache = new Map<string, CachedResponse>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Get videos from a YouTube channel via RSS feed.
   * @param channelIdentifier - Channel handle (@username) or channel ID (UC...)
   * @param limit - Maximum number of videos to return (default: 15, max: 50)
   */
  async getChannelVideos(
    channelIdentifier: string,
    limit: number = 15,
  ): Promise<YouTubeRSSResponseDto> {
    const cacheKey = `${channelIdentifier}:${limit}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      this.logger.debug(`Cache hit for channel: ${channelIdentifier}`);
      return cached.data;
    }

    // Resolve channel ID if handle is provided
    const channelId = await this.resolveChannelId(channelIdentifier);

    if (!channelId) {
      throw new NotFoundException(`Channel not found: ${channelIdentifier}`);
    }

    // Convert channel ID (UCxxxxx) to playlist ID with prefix (UULFxxxxx).
    // UULF filters content at YouTube's level — long-form videos only, no Shorts.
    const playlistId = channelId.replace(/^UC/, PLAYLIST_PREFIX);

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    this.logger.log(`Fetching YouTube RSS (${PLAYLIST_PREFIX}): ${rssUrl}`);

    const response = await fetch(rssUrl);

    if (!response.ok) {
      this.logger.error(
        `Failed to fetch RSS: ${response.status} ${response.statusText}`,
      );
      throw new NotFoundException(
        `Failed to fetch channel videos: ${response.statusText}`,
      );
    }

    const xmlText = await response.text();
    const parsed = this.xmlParser.parse(xmlText) as ParsedXml;

    const feed = parsed.feed;
    if (!feed || !feed.entry) {
      throw new NotFoundException('No videos found in channel');
    }

    const entries: RssFeedEntry[] = Array.isArray(feed.entry)
      ? feed.entry
      : [feed.entry];

    const channelTitle: string =
      (typeof feed.author?.name === 'string' ? feed.author.name : undefined) ??
      (typeof feed.title === 'string' ? feed.title : undefined) ??
      'Unknown Channel';

    // Map entries to DTOs (UULF playlist already filters Shorts at YouTube level)
    const videos: YouTubeVideoDto[] = entries.slice(0, limit).map((entry) => {
      const videoId = this.extractVideoId(
        entry['yt:videoId'] ?? entry.id ?? '',
      );
      return {
        id: videoId,
        title: typeof entry.title === 'string' ? entry.title : 'Untitled',
        description:
          typeof entry['media:group']?.['media:description'] === 'string'
            ? entry['media:group']['media:description']
            : '',
        thumbnail: this.getThumbnailUrl(videoId),
        publishedAt: this.resolvePublishedAt(entry.published, entry.updated),
        channelTitle,
        viewCount: this.parseViewCount(
          entry['media:group']?.['media:community']?.['media:statistics']?.[
            '@_views'
          ],
        ),
      };
    });

    const result: YouTubeRSSResponseDto = {
      videos,
      channelTitle,
      channelId,
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    this.cache.set(cacheKey, { data: result, cachedAt: Date.now() });

    this.logger.log(
      `Fetched ${videos.length} videos from channel: ${channelTitle}`,
    );
    return result;
  }

  /**
   * Resolve a channel handle (@username) to a channel ID (UCxxxxxx).
   * If `identifier` already looks like a channel ID it is returned as-is.
   */
  private async resolveChannelId(identifier: string): Promise<string | null> {
    // Already a channel ID — return directly
    if (identifier.startsWith('UC') && identifier.length === 24) {
      return identifier;
    }

    const handle = identifier.startsWith('@') ? identifier : `@${identifier}`;

    try {
      const channelUrl = `https://www.youtube.com/${handle}`;
      this.logger.debug(`Resolving channel ID for: ${channelUrl}`);

      const response = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Spirala/1.0)',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        this.logger.error(`Failed to fetch channel page: ${response.status}`);
        return null;
      }

      const html = await response.text();

      // Pattern 1: "channelId":"UC..."
      const match1 = /"channelId":"(UC[a-zA-Z0-9_-]{22})"/.exec(html);
      if (match1) {
        this.logger.debug(`Found channel ID (pattern 1): ${match1[1]}`);
        return match1[1];
      }

      // Pattern 2: /channel/UC... in canonical URL
      const match2 = /\/channel\/(UC[a-zA-Z0-9_-]{22})/.exec(html);
      if (match2) {
        this.logger.debug(`Found channel ID (pattern 2): ${match2[1]}`);
        return match2[1];
      }

      // Pattern 3: externalId in ytInitialData
      const match3 = /"externalId":"(UC[a-zA-Z0-9_-]{22})"/.exec(html);
      if (match3) {
        this.logger.debug(`Found channel ID (pattern 3): ${match3[1]}`);
        return match3[1];
      }

      this.logger.warn(`Could not find channel ID for: ${handle}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error resolving channel ID: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Resolve the best available publication date from an RSS entry.
   * Extracted to avoid a nested ternary (sonarjs/no-nested-conditional).
   */
  private resolvePublishedAt(
    published: string | undefined,
    updated: string | undefined,
  ): string {
    if (typeof published === 'string') return published;
    if (typeof updated === 'string') return updated;
    return new Date().toISOString();
  }

  /**
   * Extract a bare 11-character video ID from various YouTube ID formats.
   */
  private extractVideoId(input: string): string {
    if (!input) return '';

    // Already a bare video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // yt:video:XXXXXXXXXXX format
    const match = /yt:video:([a-zA-Z0-9_-]{11})/.exec(input);
    if (match) {
      return match[1];
    }

    return input;
  }

  /**
   * Return the hqdefault thumbnail URL (480×360).
   * maxresdefault (1280×720) is unreliable for older videos.
   */
  private getThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  /**
   * Parse the view-count string from the RSS feed.
   * Returns undefined when the value is absent or non-numeric.
   */
  private parseViewCount(views: string | undefined): number | undefined {
    if (!views) return undefined;
    const parsed = Number.parseInt(views, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Clear the in-memory cache (useful for testing or manual refresh).
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('YouTube cache cleared');
  }
}
