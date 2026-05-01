import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle?: string;
  viewCount?: number;
}

export interface YouTubeChannelResponse {
  videos: YouTubeVideo[];
  channelTitle: string;
  channelId: string;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const youtubeClient = {
  list(limit = 15): Promise<YouTubeChannelResponse> {
    return api.get<YouTubeChannelResponse>(`/youtube/videos?limit=${limit}`);
  },
};
