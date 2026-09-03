/**
 * Instagram metrics provider — the only way the Reels module talks to
 * Instagram. Authorized Meta/Instagram Graph API reads only.
 *
 * The public instagram.com HTML page is never fetched, parsed, or trusted for
 * metrics. Every call returns a normalized result with the endpoint, HTTP
 * status, response time, and error category so the admin diagnostics panel can
 * pinpoint OAuth, permission, media-resolution, metric-availability, or
 * rate-limit problems. Views are never fabricated.
 */
import {
  getMedia,
  getMediaPlays,
  categorizeError,
  type GraphCallResult,
  type InstagramErrorCategory,
  type InstagramMediaPayload,
} from "@/lib/instagram/graph-client";
import { shortcodeToMediaId } from "@/lib/instagram/media-id";

export interface InstagramMetrics {
  mediaId: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  retrievedAt: Date;
  source: string;
  accountName?: string | null;
  caption?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: Date | null;
}

export interface InstagramMetricsProvider {
  getMediaMetrics(mediaId: string, accessToken: string): Promise<InstagramMetricsCall>;
}

export type InstagramMetricsCall =
  | {
      ok: true;
      provider: "instagram_graph_api";
      endpoint: string;
      httpStatus: number;
      responseTimeMs: number;
      metricRequested: string;
      mediaId: string;
      data: InstagramMetrics;
      mediaCall: GraphCallResult<InstagramMediaPayload>;
      insightsCall: GraphCallResult<number> | null;
    }
  | {
      ok: false;
      provider: "instagram_graph_api";
      endpoint: string;
      httpStatus?: number;
      responseTimeMs: number;
      metricRequested: string;
      mediaId: string;
      category: InstagramErrorCategory;
      errorCode?: string;
      errorMessage: string;
    };

export type MediaResolutionResult =
  | {
      ok: true;
      mediaId: string;
      httpStatus: number;
      responseTimeMs: number;
      verifiedMedia: InstagramMediaPayload;
    }
  | {
      ok: false;
      httpStatus?: number;
      responseTimeMs: number;
      category: InstagramErrorCategory;
      errorCode?: string;
      errorMessage: string;
    };

/**
 * Resolves a reel shortcode to the numeric Graph API media id.
 *
 * Step 1 decodes the shortcode (Meta's own base64-style encoding of the
 * numeric media id). Step 2 verifies the numeric id through the authorized
 * Graph API using the connected account's token. The shortcode string itself
 * is never sent to a Meta endpoint as if it were the media id.
 */
export async function resolveMediaId(
  shortcode: string,
  accessToken: string,
): Promise<MediaResolutionResult> {
  const started = Date.now();
  const decoded = shortcodeToMediaId(shortcode);
  if (decoded === null) {
    return {
      ok: false,
      responseTimeMs: Date.now() - started,
      category: "media_resolution",
      errorMessage: `Shortcode "${shortcode}" could not be decoded to a numeric media id.`,
    };
  }
  const media = await getMedia(decoded, accessToken);
  if (media.ok) {
    return {
      ok: true,
      mediaId: decoded,
      httpStatus: media.httpStatus,
      responseTimeMs: media.responseTimeMs,
      verifiedMedia: media.data,
    };
  }
  return {
    ok: false,
    httpStatus: media.httpStatus,
    responseTimeMs: media.responseTimeMs,
    category: media.category,
    errorCode: media.errorCode,
    errorMessage: media.errorMessage,
  };
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Default provider: reads media engagement via the Instagram Graph API with
 * the connected account's token. Likes and comments are official counts; views
 * come from the `plays` insight (owned media + instagram_manage_insights).
 * When the API does not provide a views metric, `views` is null and the caller
 * records a honest metric_unavailable snapshot.
 */
export class InstagramGraphProvider implements InstagramMetricsProvider {
  async getMediaMetrics(mediaId: string, accessToken: string): Promise<InstagramMetricsCall> {
    const started = Date.now();

    const media = await getMedia(mediaId, accessToken);
    if (!media.ok) {
      return {
        ok: false,
        provider: "instagram_graph_api",
        endpoint: media.endpoint,
        httpStatus: media.httpStatus,
        responseTimeMs: media.responseTimeMs,
        metricRequested: "media engagement (like_count, comments_count)",
        mediaId,
        category: media.category,
        errorCode: media.errorCode,
        errorMessage: media.errorMessage,
      };
    }

    const mediaType = media.data.media_type ?? "IMAGE";
    const isVideo = mediaType === "REELS" || mediaType === "VIDEO";

    let insightsCall: GraphCallResult<number> | null = null;
    let views: number | null = null;
    if (isVideo) {
      insightsCall = await getMediaPlays(mediaId, accessToken);
      if (insightsCall.ok) {
        views = insightsCall.data;
      }
    }

    const ok = true as const;
    return {
      ok,
      provider: "instagram_graph_api",
      endpoint: media.endpoint,
      httpStatus: media.httpStatus,
      responseTimeMs: Date.now() - started,
      metricRequested: isVideo ? "plays (insights, owned media)" : "public like_count/comments_count",
      mediaId,
      mediaCall: media,
      insightsCall,
      data: {
        mediaId,
        views,
        likes: safeNumber(media.data.like_count),
        comments: safeNumber(media.data.comments_count),
        retrievedAt: new Date(),
        source: "instagram_api",
        accountName: media.data.username ?? null,
        caption: media.data.caption?.slice(0, 500) ?? null,
        thumbnailUrl: media.data.thumbnail_url ?? media.data.media_url ?? null,
        publishedAt: parseTimestamp(media.data.timestamp),
      },
    };
  }
}

export { categorizeError, type InstagramErrorCategory };