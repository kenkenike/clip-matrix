export const YOUTUBE_API_KEY = "AIzaSyBzi0KZ-lGhkjtfovC8hsThj4RybbjB994";
export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export type YouTubeContentType = "video" | "short" | "channel";

export interface YouTubeInsightResult {
  type: YouTubeContentType;
  url: string;
  videoId: string | null;
  title: string | null;
  description: string | null;
  channelTitle: string | null;
  channelId: string | null;
  publishedAt: string | null;
  thumbnail: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  duration: string | null;
  scrapedAt: string;
}

export type JobStatus = "pending" | "running" | "completed" | "failed" | "rate_limited";

export interface ScrapeJob {
  id: string;
  url: string;
  status: JobStatus;
  result: YouTubeInsightResult | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  attempts: number;
}
