import { YOUTUBE_API_KEY, YOUTUBE_API_BASE, type YouTubeInsightResult, type YouTubeContentType } from "./types";

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }>;
}

function parseISODuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function fetchVideoInsights(videoId: string): Promise<YouTubeInsightResult | { error: string }> {
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url);
    if (res.status === 403) {
      return { error: "API quota exceeded or invalid key" };
    }
    if (!res.ok) {
      return { error: `YouTube API error: ${res.status}` };
    }

    const data: YouTubeVideoResponse = await res.json();
    const item = data.items?.[0];
    if (!item) {
      return { error: "Video not found or is private/unavailable" };
    }

    const thumbUrl = item.snippet.thumbnails?.high?.url
      ?? item.snippet.thumbnails?.medium?.url
      ?? item.snippet.thumbnails?.default?.url
      ?? null;

    return {
      type: "video" as YouTubeContentType,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title: item.snippet.title ?? null,
      description: item.snippet.description?.slice(0, 200) ?? null,
      channelTitle: item.snippet.channelTitle ?? null,
      channelId: item.snippet.channelId ?? null,
      publishedAt: item.snippet.publishedAt ?? null,
      thumbnail: thumbUrl,
      views: parseInt(item.statistics.viewCount ?? "0", 10) || null,
      likes: parseInt(item.statistics.likeCount ?? "0", 10) || null,
      comments: parseInt(item.statistics.commentCount ?? "0", 10) || null,
      duration: item.contentDetails?.duration ? parseISODuration(item.contentDetails.duration) : null,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { error: `Failed to fetch video: ${String(err)}` };
  }
}
