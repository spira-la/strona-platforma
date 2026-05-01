import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureFlag } from '../../common/decorators/feature-flag.decorator.js';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard.js';
import type { YouTubeRSSResponseDto } from './dto/youtube-video.dto.js';
import { YouTubeService } from './youtube.service.js';

@UseGuards(FeatureFlagGuard)
@FeatureFlag('youtubeContent')
@Controller('youtube')
export class YouTubeController {
  private readonly logger = new Logger(YouTubeController.name);

  constructor(
    private readonly youtubeService: YouTubeService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET /api/youtube/videos
   *
   * Returns long-form videos from a YouTube channel via the public RSS feed.
   * No API key required — YouTube's UULF playlist feed is fully public.
   *
   * Query params:
   *   channel  - Channel handle (@Ane-Spirala) or channel ID (UC...).
   *              Falls back to the YOUTUBE_CHANNEL_HANDLE env variable when
   *              omitted, so the frontend can call /api/youtube/videos with
   *              no arguments and always get the Spirala channel.
   *   limit    - Maximum number of videos (default: 15, max: 50).
   *
   * @example GET /api/youtube/videos
   * @example GET /api/youtube/videos?channel=@Ane-Spirala&limit=6
   */
  @Get('videos')
  async getVideos(
    @Query('channel') channel?: string,
    @Query('limit') limit?: string,
  ): Promise<YouTubeRSSResponseDto> {
    const channelIdentifier =
      channel ??
      this.config.get<string>('YOUTUBE_CHANNEL_HANDLE') ??
      '@Ane-Spirala';

    const parsedLimit = limit
      ? Math.min(Number.parseInt(limit, 10) || 15, 50)
      : 15;

    this.logger.log(
      `Fetching videos for channel: ${channelIdentifier}, limit: ${parsedLimit}`,
    );

    return this.youtubeService.getChannelVideos(channelIdentifier, parsedLimit);
  }
}
