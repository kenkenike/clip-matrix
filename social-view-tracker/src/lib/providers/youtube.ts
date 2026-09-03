import {
  type SocialProvider,
  type ProviderPlatform,
  type ContentKind,
  type UrlValidationResult,
  type ContentMetadata,
  type CollectionResult,
  type ProviderInput,
  type HistoricalPoint,
  RateLimitedError,
  fetchJson,
  fetchHtml,
} from "@/lib/providers/types";
import { prisma } from "@/lib/db";

const YT_WATCH = /(?:youtube\.com|youtube-nocookie\.com)\/watch\?v=([\w-]{6,})/;
const YT_SHORT = /youtube\.com\/shorts\/([\w-]{6,})/;
const YT_LIVE = /youtube\.com\/live\/([\w-]{6,})/;
const YT_EMBED = /youtube\.com\/embed\/([\w-]{6,})/;
const YT_BARE = /(?:^|\.)youtu\.be\/([\w-]{6,})/;
const YT_CHANNEL_ID = /youtube\.com\/channel\/(UC[\w-]{6,})/;
const YT_HANDLE = /youtube\.com\/@([\w.-]{2,})/;

export class YouTubeProvider implements SocialProvider {
  readonly platform: ProviderPlatform = "YOUTUBE";

  constructor(private readonly apiKey?: string) {}

  private key(): string | null {
    return this.apiKey ?? process.env.YOUTUBE_API_KEY ?? null;
  }

  validateUrl(rawUrl: string): UrlValidationResult {
    const url = rawUrl.trim();
    const watch = url.match(YT_WATCH);
    if (watch) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "VIDEO",
        externalId: watch[1],
        normalizedUrl: `https://www.youtube.com/watch?v=${watch[1]}`,
      };
    }
    const short = url.match(YT_SHORT);
    if (short) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "SHORT",
        externalId: short[1],
        normalizedUrl: `https://www.youtube.com/watch?v=${short[1]}`,
      };
    }
    const live = url.match(YT_LIVE);
    if (live) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "LIVE",
        externalId: live[1],
        normalizedUrl: `https://www.youtube.com/watch?v=${live[1]}`,
      };
    }
    const embed = url.match(YT_EMBED);
    if (embed) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "VIDEO",
        externalId: embed[1],
        normalizedUrl: `https://www.youtube.com/watch?v=${embed[1]}`,
      };
    }
    const bare = url.match(YT_BARE);
    if (bare) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "VIDEO",
        externalId: bare[1],
        normalizedUrl: `https://www.youtube.com/watch?v=${bare[1]}`,
      };
    }
    const channel = url.match(YT_CHANNEL_ID);
    if (channel) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "OTHER",
        externalId: channel[1],
        normalizedUrl: `https://www.youtube.com/channel/${channel[1]}`,
      };
    }
    const handle = url.match(YT_HANDLE);
    if (handle) {
      return {
        valid: true,
        platform: "YOUTUBE",
        kind: "OTHER",
        externalId: handle[1],
        normalizedUrl: `https://www.youtube.com/@${handle[1]}`,
      };
    }
    return {
      valid: false,
      error: `Unsupported YouTube URL: ${url}`,
    };
  }

  private videoUrl(id: string): string {
    const key = this.key();
    if (!key) {
      throw new Error(
        "YouTube Data API key is not configured. Set YOUTUBE_API_KEY to retrieve YouTube metrics.",
      );
    }
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id,
      key,
    });
    return `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;
  }

  private channelUrl(id: string): string {
    const key = this.key();
    if (!key) {
      throw new Error(
        "YouTube Data API key is not configured. Set YOUTUBE_API_KEY to retrieve YouTube metrics.",
      );
    }
    const params = new URLSearchParams({ key, part: "snippet,statistics" });
    if (id.startsWith("UC")) {
      params.set("id", id);
    } else {
      params.set("forHandle", id);
    }
    return `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`;
  }

  private async fetchVideo(id: string) {
    const { body } = await fetchJson(this.videoUrl(id));
    const items = (body.items as Array<Record<string, unknown>> | undefined) ?? [];
    if (items.length === 0) {
      throw new Error("YouTube returned no video for this id. It may be private or deleted.");
    }
    return items[0];
  }

  async getContentMetadata(input: ProviderInput): Promise<ContentMetadata> {
    if (input.kind === "OTHER") {
      const { body } = await fetchJson(this.channelUrl(input.externalId));
      const items = (body.items as Array<Record<string, unknown>> | undefined) ?? [];
      const item = items[0];
      if (!item) throw new Error("YouTube returned no channel for this id.");
      const snippet = item.snippet as Record<string, unknown>;
      return {
        title: (snippet.title as string) ?? undefined,
        accountName: (snippet.title as string) ?? undefined,
        thumbnailUrl: thumbnailOf(snippet),
        publishedAt: parseDate(snippet.publishedAt),
      };
    }
    const item = await this.fetchVideo(input.externalId);
    const snippet = item.snippet as Record<string, unknown>;
    const contentDetails = item.contentDetails as Record<string, unknown>;
    return {
      title: (snippet.title as string) ?? undefined,
      accountName: (snippet.channelTitle as string) ?? undefined,
      thumbnailUrl: thumbnailOf(snippet),
      publishedAt: parseDate(snippet.publishedAt),
      kind: contentDetails?.duration
        ? kindFromDuration(contentDetails.duration as string, input.kind)
        : input.kind,
    };
  }

  async getMetrics(input: ProviderInput): Promise<CollectionResult> {
    if (!this.key()) {
      return this.webMetrics(input);
    }
    try {
      if (input.kind === "OTHER") {
        const { body } = await fetchJson(this.channelUrl(input.externalId));
        const items = (body.items as Array<Record<string, unknown>> | undefined) ?? [];
        const item = items[0];
        if (!item) throw new Error("YouTube returned no channel for this id.");
        const snippet = item.snippet as Record<string, unknown>;
        const statistics = item.statistics as Record<string, unknown>;
        return {
          status: "COMPLETED",
          source: "OFFICIAL",
          metadata: {
            title: (snippet.title as string) ?? undefined,
            accountName: (snippet.title as string) ?? undefined,
            thumbnailUrl: thumbnailOf(snippet),
            publishedAt: parseDate(snippet.publishedAt),
            kind: "OTHER",
          },
          metrics: {
            views: safeNumber(statistics.viewCount),
            likes: null,
            comments: null,
          },
        };
      }
      const item = await this.fetchVideo(input.externalId);
      const snippet = item.snippet as Record<string, unknown>;
      const statistics = item.statistics as Record<string, unknown>;
      const contentDetails = item.contentDetails as Record<string, unknown>;
      return {
        status: "COMPLETED",
        source: "OFFICIAL",
        metadata: {
          title: (snippet.title as string) ?? undefined,
          accountName: (snippet.channelTitle as string) ?? undefined,
          thumbnailUrl: thumbnailOf(snippet),
          publishedAt: parseDate(snippet.publishedAt),
          kind: contentDetails?.duration
            ? kindFromDuration(contentDetails.duration as string, input.kind)
            : input.kind,
        },
        metrics: {
          views: safeNumber(statistics.viewCount),
          likes: safeNumber(statistics.likeCount),
          comments: safeNumber(statistics.commentCount),
        },
      };
    } catch (err) {
      if (err instanceof RateLimitedError) throw err;
      if (err instanceof Error) {
        return {
          status: "FAILED",
          error: err.message,
        };
      }
      return { status: "FAILED", error: "Unknown YouTube API error." };
    }
  }

  /**
   * Best-effort collection from the public watch page when no Data API key is
   * configured. Extracts metrics from `ytInitialPlayerResponse` and labels the
   * result as WEB so it is never mistaken for verified API data.
   */
  private async webMetrics(input: ProviderInput): Promise<CollectionResult> {
    if (input.kind === "OTHER") {
      return {
        status: "UNAVAILABLE",
        error:
          "YouTube channel metrics unavailable without the YouTube Data API. Configure YOUTUBE_API_KEY to track channels.",
      };
    }
    const html = await fetchHtml(`https://www.youtube.com/watch?v=${input.externalId}`);
    if (!html) {
      return {
        status: "FAILED",
        error: "Could not load the YouTube watch page for this video.",
      };
    }
    const player = extractPlayerResponse(html);
    const videoDetails = (player?.videoDetails ?? {}) as Record<string, unknown>;
    const microformat = (
      (player?.microformat as Record<string, unknown> | undefined)?.playerMicroformatRenderer ??
      {}
    ) as Record<string, unknown>;
    if (Object.keys(videoDetails).length === 0) {
      return {
        status: "UNAVAILABLE",
        error:
          "Could not read engagement from the public page (it may be gated, age-restricted, or region-blocked).",
      };
    }
    const views = safeNumber(videoDetails.viewCount);
    const likes = safeNumber(videoDetails.likes);
    const title = (videoDetails.title as string) ?? undefined;
    const accountName = (videoDetails.author as string) ?? undefined;
    const thumbnail = (
      (videoDetails.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)
        ?.thumbnails?.slice(-1)[0]?.url
    ) ?? undefined;
    const uploadDateStr = (microformat.uploadDate as string) ?? undefined;
    let kind = input.kind;
    const approxMs = videoDetails.approxDurationMs;
    if (typeof approxMs === "string") {
      const secs = Number(approxMs) / 1000;
      if (!Number.isNaN(secs)) {
        if (secs <= 180 && input.kind !== "LIVE") kind = "SHORT";
        else if (secs < 3600) kind = "VIDEO";
        else kind = "LIVE";
      }
    }
    return {
      status: views === null ? "UNAVAILABLE" : "COMPLETED",
      source: "WEB",
      metadata: {
        title,
        accountName,
        thumbnailUrl: thumbnail,
        publishedAt: uploadDateStr ? parseDate(uploadDateStr) : undefined,
        kind,
      },
      metrics: {
        views,
        likes,
        comments: null,
      },
      error:
        views === null
          ? "The public page did not expose a view count for this video."
          : undefined,
    };
  }

  async getHistoricalMetrics(contentId: string): Promise<HistoricalPoint[]> {
    const snapshots = await prisma.metricSnapshot.findMany({
      where: { contentId },
      orderBy: { capturedAt: "asc" },
      select: { capturedAt: true, views: true, likes: true, comments: true },
    });
    return snapshots.map((s) => ({
      capturedAt: s.capturedAt,
      views: s.views === null ? null : Number(s.views),
      likes: s.likes === null ? null : Number(s.likes),
      comments: s.comments === null ? null : Number(s.comments),
    }));
  }
}

function kindFromDuration(iso: string, fallback: ContentKind): ContentKind {
  if (fallback === "LIVE") return "LIVE";
  const match = iso.match(/^P?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (match) {
    const secs =
      Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
    if (secs <= 180) return "SHORT";
    if (secs < 3600) return "VIDEO";
    return "LIVE";
  }
  return fallback;
}

function thumbnailOf(snippet: Record<string, unknown>): string | undefined {
  const thumbs = snippet.thumbnails as
    | Record<string, { url?: string }>
    | undefined;
  if (!thumbs) return undefined;
  return (
    thumbs.high?.url ??
    thumbs.medium?.url ??
    thumbs.default?.url ??
    thumbs.maxres?.url ??
    undefined
  );
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

/**
 * Extracts the embedded `ytInitialPlayerResponse = {...};` JSON object from the
 * watch page HTML. Uses a brace/quote-aware scan so `;` characters inside JSON
 * strings do not truncate the payload.
 */
function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const marker = "ytInitialPlayerResponse";
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const start = html.indexOf("{", idx);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}