import { useQuery } from '@tanstack/react-query';
import {
  youtubeClient,
  type YouTubeChannelResponse,
} from '@/clients/youtube.client';

const THIRTY_MINUTES = 1000 * 60 * 30;
const ONE_HOUR = 1000 * 60 * 60;

/**
 * Fetches videos from the Spirala YouTube channel via the backend proxy.
 * Matches the backend's 1-hour RSS cache: stale after 30 min, gc after 1 hour.
 */
export function useYouTubeVideos(limit = 15) {
  return useQuery<YouTubeChannelResponse, Error>({
    queryKey: ['youtube', 'videos', limit],
    queryFn: () => youtubeClient.list(limit),
    staleTime: THIRTY_MINUTES,
    gcTime: ONE_HOUR,
    retry: 1,
  });
}
