import type { YouTubeContentType } from "./types";

interface ParsedYouTubeUrl {
  valid: boolean;
  type: YouTubeContentType | null;
  videoId: string | null;
  channelId: string | null;
  error: string | null;
}

export function parseYouTubeUrl(raw: string): ParsedYouTubeUrl {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { valid: false, type: null, videoId: null, channelId: null, error: "Invalid URL format" };
  }

  const host = url.hostname.replace(/^www\./, "");

  // youtu.be/{id}
  if (host === "youtu.be") {
    const videoId = url.pathname.slice(1).split(/[?&#]/)[0];
    if (videoId) return { valid: true, type: "video", videoId, channelId: null, error: null };
  }

  // youtube.com paths
  if (host === "youtube.com" || host === "m.youtube.com") {
    // /watch?v={id}
    const vParam = url.searchParams.get("v");
    if (vParam) return { valid: true, type: "video", videoId: vParam, channelId: null, error: null };

    const path = url.pathname.replace(/\/+$/, "");

    // /shorts/{id}
    const shortsMatch = path.match(/^\/shorts\/([A-Za-z0-9_-]+)/);
    if (shortsMatch) return { valid: true, type: "short", videoId: shortsMatch[1], channelId: null, error: null };

    // /embed/{id}
    const embedMatch = path.match(/^\/embed\/([A-Za-z0-9_-]+)/);
    if (embedMatch) return { valid: true, type: "video", videoId: embedMatch[1], channelId: null, error: null };

    // /channel/{id}
    const channelMatch = path.match(/^\/channel\/([A-Za-z0-9_-]+)/);
    if (channelMatch) return { valid: true, type: "channel", videoId: null, channelId: channelMatch[1], error: null };

    // /@handle or /user/{name} — channel pages (no video ID)
    const handleMatch = path.match(/^\/@([A-Za-z0-9_-]+)/);
    if (handleMatch) return { valid: true, type: "channel", videoId: null, channelId: null, error: null };

    const userMatch = path.match(/^\/user\/([A-Za-z0-9_-]+)/);
    if (userMatch) return { valid: true, type: "channel", videoId: null, channelId: null, error: null };

    // /c/{name}
    const cMatch = path.match(/^\/c\/([A-Za-z0-9_-]+)/);
    if (cMatch) return { valid: true, type: "channel", videoId: null, channelId: null, error: null };
  }

  return { valid: false, type: null, videoId: null, channelId: null, error: "Could not identify a YouTube video or shorts URL" };
}
