export type InstagramContentType = "post" | "reel" | "profile";

export interface InstagramInsightResult {
  type: InstagramContentType;
  url: string;
  caption: string | null;
  timestamp: string | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  engagementRate: number | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  username: string | null;
  fullName: string | null;
  isPrivate: boolean;
  scrapedAt: string;
}

export type JobStatus = "pending" | "running" | "completed" | "failed" | "rate_limited";

export interface ScrapeJob {
  id: string;
  url: string;
  status: JobStatus;
  result: InstagramInsightResult | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  attempts: number;
}

export interface ScrapeError {
  kind: "invalid_url" | "private" | "deleted" | "rate_limited" | "unknown";
  message: string;
}

export const IG_APP_ID = "936619743392459";

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
];
