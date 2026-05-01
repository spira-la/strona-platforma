export interface YouTubeVideoDto {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  viewCount?: number;
}

export interface YouTubeRSSResponseDto {
  videos: YouTubeVideoDto[];
  channelTitle: string;
  channelId: string;
  fetchedAt: string;
}
