import {
  type SocialProvider,
  type ProviderPlatform,
  type UrlValidationResult,
  type ContentMetadata,
  type CollectionResult,
  type ProviderInput,
  type HistoricalPoint,
  RateLimitedError,
  fetchJson,
  fetchHtml,
  WEB_UA,
} from "@/lib/providers/types";
import { prisma } from "@/lib/db";

const IG_POST = /instagram\.com\/p\/([\w-]+)\/?/;
const IG_REEL = /instagram\.com\/reel(?:s)?\/([\w-]+)\/?/;
const IG_TV = /instagram\.com\/tv\/([\w-]+)\/?/;
const IG_PROFILE = /instagram\.com\/([A-Za-z0-9._]{1,30})\/?$/;
const GRAPH_API_BASE = "https://graph.instagram.com";

/**
 * Instagram provider.
 *
 * Instagram does not expose public, unauthenticated metrics. Two official
 * paths exist when a user has connected one or more Business/Creator accounts:
 *
 *   1. A post/reel shortcode is resolved to the numeric Media ID by scanning
 *      the linked account's own `/me/media` (each token belongs to one of the
 *      accounts the user owns, so this is reading their own content).
 *   2. The numeric Media ID is queried via the Instagram Graph API for likes,
 *      comments, caption, timestamp, permalink, and thumbnail.
 *
 * The Graph API does not expose a public view-count field for posts/reels
 * (except via owned-media insights, which require a Facebook token), so the
 * official path reports views as null rather than inventing them. If no full
 * media object can be obtained, the provider falls back to the public page
 * (WEB) and otherwise honestly reports UNAVAILABLE.
 */
export type InstagramAccountConfig = {
  username: string;
  accessToken: string;
  insightsAccessToken?: string | null;
  sessionCookie?: string | null;
};

export class InstagramProvider implements SocialProvider {
  readonly platform: ProviderPlatform = "INSTAGRAM";

  constructor(private readonly accounts: ReadonlyArray<InstagramAccountConfig> = []) {}

  private tokens(): Array<InstagramAccountConfig> {
    const valid = this.accounts.filter((a) => a.accessToken && a.accessToken.trim() !== "");
    const legacy = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
    if (valid.length === 0 && legacy) {
      return [{ username: "linked-account", accessToken: legacy, insightsAccessToken: null }];
    }
    return valid;
  }

  validateUrl(rawUrl: string): UrlValidationResult {
    const url = rawUrl.trim();
    const reel = url.match(IG_REEL);
    if (reel) {
      return {
        valid: true,
        platform: "INSTAGRAM",
        kind: "REEL",
        externalId: reel[1],
        normalizedUrl: `https://www.instagram.com/reel/${reel[1]}/`,
      };
    }
    const post = url.match(IG_POST);
    if (post) {
      return {
        valid: true,
        platform: "INSTAGRAM",
        kind: "POST",
        externalId: post[1],
        normalizedUrl: `https://www.instagram.com/p/${post[1]}/`,
      };
    }
    const tv = url.match(IG_TV);
    if (tv) {
      return {
        valid: true,
        platform: "INSTAGRAM",
        kind: "OTHER",
        externalId: tv[1],
        normalizedUrl: `https://www.instagram.com/tv/${tv[1]}/`,
      };
    }
    const profile = url.match(IG_PROFILE);
    if (profile && !["explore", "reels", "p", "reel"].includes(profile[1])) {
      return {
        valid: true,
        platform: "INSTAGRAM",
        kind: "OTHER",
        externalId: profile[1],
        normalizedUrl: `https://www.instagram.com/${profile[1]}/`,
      };
    }
    return {
      valid: false,
      error: `Unsupported Instagram URL: ${url}`,
    };
  }

  async getContentMetadata(): Promise<ContentMetadata> {
    // Metadata is populated during getMetrics (both Graph API and web paths).
    return {};
  }

  async getMetrics(input: ProviderInput): Promise<CollectionResult> {
    if (input.kind === "OTHER") {
      return {
        status: "UNAVAILABLE",
        error:
          "Instagram profile metrics are not publicly available. Provide a post or reel URL, or connect a Meta Graph API token for linked accounts.",
      };
    }

    const tokens = this.tokens();
    const numericMediaId = /^\d+$/.test(input.externalId);
    const accounts = tokens.length > 0 ? tokens : this.accounts;

    // 1) Official path. Prefers a resolved shortcode, then raw numeric IDs.
    if (tokens.length > 0) {
      try {
        const resolved = await this.resolveMediaId(input.externalId);
        if (resolved) {
          const result = await this.officialMetrics(
            resolved.accessToken,
            resolved.mediaId,
            resolved.username,
            resolved.insightsAccessToken,
          );
          if (result?.status === "COMPLETED") {
            return await this.withSessionViews(result, input.externalId, resolved.sessionCookie);
          }
          if (result) return result;
        }
        // A numeric Media ID with no shortcode resolution: try each linked token
        // directly (matches the legacy single-token behaviour).
        if (numericMediaId) {
          for (const account of tokens) {
            const result = await this.officialMetrics(
              account.accessToken,
              input.externalId,
              account.username,
              account.insightsAccessToken,
            );
            if (result?.status === "COMPLETED") {
              return await this.withSessionViews(result, input.externalId, account.sessionCookie);
            }
            if (result) return result;
          }
        }
      } catch (err) {
        if (err instanceof RateLimitedError) throw err;
        return {
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown Instagram Graph API error.",
        };
      }
    }

    // 2) Session-only scrape (Apify-style): reads the account's own public page
    //    with the owner-supplied `sessionid` cookie. Labeled WEB.
    if (tokens.length === 0 || this.accounts.some((a) => a.sessionCookie)) {
      for (const account of accounts) {
        if (!account.sessionCookie || account.sessionCookie.trim() === "") continue;
        const sessionResult = await sessionMetrics(
          input.externalId,
          account.sessionCookie,
          account.username,
        );
        if (sessionResult) return sessionResult;
      }
    }

    // 3) Honest fallback: the anonymous public page (usually a login wall).
    return this.webMetrics(input);
  }

  /**
   * Official results never include reel view counts (unless an insights token
   * is configured). When a session cookie exists, fill the missing views from
   * the owner's session view of the post and relabel the snapshot WEB because a
   * session-scraped number is part of it.
   */
  private async withSessionViews(
    result: CollectionResult,
    shortcode: string,
    sessionCookie?: string | null,
  ): Promise<CollectionResult> {
    if (result.metrics?.views != null || !sessionCookie || sessionCookie.trim() === "") {
      return result;
    }
    const session = await sessionMetrics(shortcode, sessionCookie);
    if (session?.metrics?.views == null) return result;
    const base = result.metrics ?? {};
    return {
      ...result,
      source: "WEB",
      metrics: {
        views: session.metrics.views,
        likes: base.likes ?? session.metrics.likes,
        comments: base.comments ?? session.metrics.comments,
      },
    };
  }

  /**
   * Resolves a shortcode to a numeric Media ID by scanning an owned account's
   * own media list. Returning null means "no linked account owns this post".
   */
  private async resolveMediaId(shortcode: string): Promise<{
    mediaId: string;
    username: string;
    accessToken: string;
    insightsAccessToken?: string | null;
    sessionCookie?: string | null;
  } | null> {
    const normalized = shortcode.toLowerCase();
    for (const account of this.tokens()) {
      const cacheKey = `${account.accessToken}::${normalized}`;
      const hit = mediaCache.get(cacheKey);
      if (hit && Date.now() - hit.matchedAt < MEDIA_CACHE_TTL_MS) {
        return {
          mediaId: hit.mediaId,
          username: hit.username,
          accessToken: hit.accessToken,
          insightsAccessToken: hit.insightsAccessToken,
          sessionCookie: hit.sessionCookie,
        };
      }
      const mediaId = await scanMediaForShortcode(account.accessToken, normalized, account.username);
      if (mediaId) {
        mediaCache.set(cacheKey, {
          mediaId,
          username: account.username,
          accessToken: account.accessToken,
          insightsAccessToken: account.insightsAccessToken ?? null,
          sessionCookie: account.sessionCookie ?? null,
          matchedAt: Date.now(),
        });
        return {
          mediaId,
          username: account.username,
          accessToken: account.accessToken,
          insightsAccessToken: account.insightsAccessToken,
          sessionCookie: account.sessionCookie,
        };
      }
    }
    return null;
  }

  private async officialMetrics(
    token: string,
    mediaId: string,
    accountName: string,
    insightsAccessToken?: string | null,
  ): Promise<CollectionResult | null> {
    try {
      const params = new URLSearchParams({
        fields:
          "id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count,timestamp,username",
        access_token: token,
      });
      const { body } = await fetchJson(
        `${GRAPH_API_BASE}/v21.0/${mediaId}?${params.toString()}`,
      );
      if ((body.error as { message?: string } | undefined)?.message) {
        const message = (body.error as { message: string; code?: number }).message;
        const code = (body.error as { code?: number }).code;
        // The post does not belong to this linked account — not a hard failure.
        if (code === 100 || /does not belong|not (?:found|available)|bad parameter/i.test(message)) {
          return null;
        }
        return {
          status: "FAILED",
          error: `Instagram Graph API (${accountName}): ${message}`,
        };
      }
      const mediaType = (body.media_type as string) ?? "POST";
      return {
        status: "COMPLETED",
        source: "OFFICIAL",
        metadata: {
          caption: (body.caption as string | undefined)?.slice(0, 500),
          thumbnailUrl:
            (body.thumbnail_url as string | undefined) ??
            (body.media_url as string | undefined),
          publishedAt: parseTimestamp(body.timestamp),
          accountName: (body.username as string | undefined) ?? accountName,
          kind: mediaType === "REELS" || mediaType === "VIDEO" ? "REEL" : "POST",
        },
        metrics: {
          views: await playsInsights(mediaId, mediaType, insightsAccessToken),
          likes: safeNumber(body.like_count),
          comments: safeNumber(body.comments_count),
        },
      };
    } catch (err) {
      if (err instanceof RateLimitedError) throw err;
      if (err instanceof Error) {
        return { status: "FAILED", error: `Instagram (${accountName}): ${err.message}` };
      }
      return { status: "FAILED", error: "Unknown Instagram Graph API error." };
    }
  }

  private async webMetrics(input: ProviderInput): Promise<CollectionResult> {
    if (input.kind === "OTHER") {
      return {
        status: "UNAVAILABLE",
        error:
          "Instagram profile metrics are not publicly available. Provide a post or reel URL, or connect a Meta Graph API token for linked accounts.",
      };
    }
    const slug = input.kind === "POST" ? "p" : "reel";
    const pageUrl = `https://www.instagram.com/${slug}/${input.externalId}/`;
    const html = await fetchHtml(pageUrl);
    if (!html) {
      return {
        status: "FAILED",
        error: "Could not load the Instagram page for this media.",
      };
    }
    const ld = extractLdJson(html);
    if (!ld) {
      return {
        status: "UNAVAILABLE",
        error:
          "Instagram's public page did not expose engagement data (login or challenge wall). Marked Unavailable instead of bypassing access controls.",
      };
    }
    const views = readInteractionCount(ld, /watch|view/i);
    const likes = readInteractionCount(ld, /like/i) ?? safeNumber(ld.likeCount);
    const comments = safeLdNumber(ld.commentCount);
    const authorValue = ld.author;
    const accountName =
      typeof authorValue === "object" && authorValue !== null
        ? ((authorValue as { name?: string }).name ?? (authorValue as { "@type"?: unknown }))
        : typeof authorValue === "string"
          ? safeAuthorName(authorValue)
          : undefined;
    if (views === null && likes === null && comments === null) {
      return {
        status: "UNAVAILABLE",
        error:
          "Instagram's public page exposed no engagement counters for this media.",
      };
    }
    return {
      status: "COMPLETED",
      source: "WEB",
      metadata: {
        caption: safeString(ld.caption)?.slice(0, 500) ?? undefined,
        thumbnailUrl: safeString(ld.thumbnailUrl) ?? undefined,
        publishedAt: parseTimestamp(safeLdDate(ld)),
        kind: input.kind === "POST" ? "POST" : "REEL",
        accountName: safeString(accountName) ?? undefined,
      },
      metrics: { views, likes, comments },
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

function safeNumber(value: unknown): number | null {
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  if (typeof value === "number") return Math.round(value);
  return null;
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Public-page (WEB) extraction helpers
// ---------------------------------------------------------------------------

type MediaCacheEntry = {
  mediaId: string;
  username: string;
  accessToken: string;
  insightsAccessToken: string | null;
  sessionCookie: string | null;
  matchedAt: number;
};

// shortcode -> media-id resolution cache (per token), refreshed daily.
const mediaCache = new Map<string, MediaCacheEntry>();
const MEDIA_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// Bounds how far into each account's media list we scan for a shortcode.
const MEDIA_SCAN_PAGE_LIMIT = 15;

async function scanMediaForShortcode(
  token: string,
  normalizedShortcode: string,
  username: string,
): Promise<string | null> {
  let cursor: string | null = null;
  for (let page = 0; page < MEDIA_SCAN_PAGE_LIMIT; page++) {
    const params = new URLSearchParams({
      fields: "id,shortcode",
      access_token: token,
      limit: "100",
    });
    if (cursor) params.set("after", cursor);
    const { body } = await fetchJson(
      `${GRAPH_API_BASE}/v21.0/me/media?${params.toString()}`,
    );
    const err = (body.error as { message?: string } | undefined)?.message;
    if (err) throw new Error(`Instagram (${username}): ${err}`);
    const data = (body.data as Array<{ id?: string; shortcode?: string }> | undefined) ?? [];
    const match = data.find((m) => m.shortcode?.toLowerCase() === normalizedShortcode);
    if (match?.id) return match.id;
    cursor =
      ((body.paging as { cursors?: { after?: string } } | undefined)?.cursors?.after) ??
      null;
    if (!cursor) break;
  }
  return null;
}

/**
 * Official per-media plays for reels/videos via the Instagram Insights (Facebook
 * Graph) endpoint. Requires a token with `instagram_business_manage_insights`
 * that owns the media. Best-effort: any failure leaves views as null.
 */
async function playsInsights(
  mediaId: string,
  mediaType: string,
  token?: string | null,
): Promise<number | null> {
  if (!token || token.trim() === "") return null;
  if (mediaType !== "REELS" && mediaType !== "VIDEO") return null;
  try {
    const { body } = await fetchJson(
      `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=plays&access_token=${encodeURIComponent(token)}`,
    );
    if ((body.error as { message?: string } | undefined)?.message) return null;
    const data =
      (body.data as Array<{ name?: string; values?: Array<{ value?: number }> }> | undefined) ?? [];
    const plays = data.find((d) => d.name === "plays")?.values?.[0]?.value;
    return typeof plays === "number" && Number.isFinite(plays)
      ? Math.round(plays)
      : null;
  } catch {
    // Rate limits or permission gaps on insights must not fail the check.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session (Apify-style) extraction
// ---------------------------------------------------------------------------

type SessionMedia = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  caption?: string;
  accountName?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  kind?: "REEL" | "POST";
};

/**
 * Reads a post as the account owner sees it, using the owner-supplied
 * `sessionid` cookie (Apify-style). Uses Instagram's web GraphQL endpoint and
 * falls back to scanning the embedded JSON in the HTML. Any failure returns
 * null so callers can fall through to the honest anonymous path.
 */
async function sessionMetrics(
  shortcode: string,
  sessionCookie: string,
  username?: string,
): Promise<CollectionResult | null> {
  const url = `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/?__a=1&__d=dis`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      cache: "no-cache",
      signal: controller.signal,
      headers: {
        "User-Agent": WEB_UA,
        "Accept-Language": "en-US,en;q=0.9",
        "X-IG-App-ID": "936619743392459",
        Cookie: `sessionid=${sessionCookie}`,
        Referer: "https://www.instagram.com/",
      },
    });
    const text = await res.text();
    if (!text) return null;
    const media = parseSessionMedia(text);
    if (!media) return null;
    if (media.views == null && media.likes == null && media.comments == null) return null;
    return {
      status: "COMPLETED",
      source: "WEB",
      metadata: {
        caption: media.caption?.slice(0, 500),
        accountName: media.accountName ?? username,
        thumbnailUrl: media.thumbnailUrl,
        publishedAt: media.publishedAt,
        kind: media.kind,
      },
      metrics: { views: media.views, likes: media.likes, comments: media.comments },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseSessionMedia(text: string): SessionMedia | null {
  // Preferred: JSON from the `__a=1` GraphQL endpoint.
  try {
    const data = JSON.parse(text) as {
      graphql?: { shortcode_media?: Record<string, unknown> };
      items?: Array<Record<string, unknown>>;
      message?: string;
    };
    if (data.message) return null;
    const media = data.graphql?.shortcode_media ?? data.items?.[0];
    if (!media) return null;
    return sessionMediaFromRecord(media);
  } catch {
    // Fall back to scanning the embed JSON inside the HTML page.
  }

  if (/\b(login|log in)\b/i.test(text) && !/"video_view_count":\d+/.test(text)) return null;

  const views = scanNumber(text, /"video_view_count":(\d+)/) ?? scanNumber(text, /"play_count":(\d+)/);
  const likes =
    scanNumber(text, /"edge_media_preview_like":\{"count":(\d+)/) ??
    scanNumber(text, /"like_count":(\d+)/);
  const comments =
    scanNumber(text, /"edge_media_to_comment":\{"count":(\d+)/) ??
    scanNumber(text, /"comment_count":(\d+)/);
  if (views == null && likes == null && comments == null) return null;
  return {
    views,
    likes,
    comments,
    caption: scanString(text, /"text":"((?:[^"\\]|\\.)*)"/),
    accountName: scanString(text, /"username":"([A-Za-z0-9._]+)"/),
    thumbnailUrl: scanString(text, /"display_url":"([^"]+)"/),
    publishedAt: secondsToDate(scanNumber(text, /"taken_at_timestamp":(\d{9,})/)) ?? undefined,
    kind: /"is_video":true/.test(text) ? "REEL" : "POST",
  };
}

function sessionMediaFromRecord(media: Record<string, unknown>): SessionMedia | null {
  const views =
    safeNumber(media.video_view_count) ??
    safeNumber(media.view_count) ??
    safeNumber(media.play_count);
  const likes = nestedCount(media.edge_media_preview_like);
  const comments = nestedCount(media.edge_media_to_comment);
  const captionEdges = media.edge_media_to_caption as { edges?: Array<{ node?: { text?: string } }> } | undefined;
  const owner = media.owner as { username?: string } | undefined;
  const kind = media.is_video === true || media.media_type === 2 ? "REEL" : "POST";
  return {
    views,
    likes,
    comments,
    caption: captionEdges?.edges?.[0]?.node?.text,
    accountName: owner?.username,
    thumbnailUrl: (media.display_url as string | undefined) ?? (media.thumbnail_src as string | undefined),
    publishedAt: secondsToDate(media.taken_at_timestamp) ?? undefined,
    kind,
  };
}

function nestedCount(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  return safeNumber((value as { count?: unknown }).count);
}

function scanNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function scanString(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.replace(/\\u0026/g, "&").replace(/\\"/g, '"');
}

function secondsToDate(value: unknown): Date | null {
  const n = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

function extractLdJson(html: string): Record<string, unknown> | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim()) as unknown;
      const item = Array.isArray(data) ? data[0] : data;
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const rec = item as Record<string, unknown>;
        if ("interactionStatistic" in rec || "commentCount" in rec || "likeCount" in rec) {
          return rec;
        }
      }
    } catch {
      // Try the next ld+json block.
    }
  }
  return null;
}

function readInteractionCount(
  ld: Record<string, unknown>,
  typePattern: RegExp,
): number | null {
  const stats = ld.interactionStatistic;
  if (!stats) return null;
  const list = Array.isArray(stats) ? stats : [stats];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const interactionType = rec.interactionType;
    const typeStr =
      typeof interactionType === "string"
        ? interactionType
        : interactionType && typeof interactionType === "object"
          ? JSON.stringify(interactionType)
          : "";
    if (typePattern.test(typeStr)) {
      const count = safeLdNumber(rec.userInteractionCount);
      if (count !== null) return count;
    }
  }
  return null;
}

function safeLdNumber(value: unknown): number | null {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function safeAuthorName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/^@/, "").trim();
  return cleaned !== "" ? cleaned : null;
}

function safeLdDate(ld: Record<string, unknown>): string | undefined {
  for (const key of ["datePublished", "uploadDate", "dateCreated", "published", "created_at"]) {
    if (typeof ld[key] === "string") return ld[key] as string;
  }
  return undefined;
}