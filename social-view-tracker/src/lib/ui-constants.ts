export const STATUS_NAMES: Record<string, string> = {
  PROCESSING: "Collecting",
  COMPLETED: "Complete",
  FAILED: "Failed",
  UNAVAILABLE: "Unavailable",
  RATE_LIMITED: "Rate limited",
};

export const STATUS_COLORS: Record<string, string> = {
  PROCESSING: "#f59e0b",
  COMPLETED: "#10b981",
  FAILED: "#ef4444",
  UNAVAILABLE: "#64748b",
  RATE_LIMITED: "#f59e0b",
};

export const PLATFORM_NAMES: Record<string, string> = {
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  X: "X (Twitter)",
};

export const KIND_NAMES: Record<string, string> = {
  VIDEO: "Video",
  SHORT: "Short",
  LIVE: "Live",
  REEL: "Reel",
  POST: "Post",
  TWEET: "Tweet",
  OTHER: "Other",
};

export const SOURCE_LABELS: Record<string, string> = {
  OFFICIAL: "Official API",
  WEB: "Public page",
};