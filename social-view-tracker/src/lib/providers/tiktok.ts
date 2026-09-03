import {
  type SocialProvider,
  type ProviderPlatform,
  type UrlValidationResult,
  type ContentMetadata,
  type CollectionResult,
  type ProviderInput,
  type HistoricalPoint,
  fetchHtml,
  WEB_UA,
} from "@/lib/providers/types";
import { prisma } from "@/lib/db";

const TT_FULL = /tiktok\.com\/@([\w.-]+)\/video\/(\d+)/;
const TT_SHORT = /tiktok\.com\/t\/([\w]+)/;
const TT_VM = /(?:vm|vt)\.tiktok\.com\/([\w]+)/;

/**
 * TikTok provider.
 *
 * TikTok exposes no public-official metrics API. This adapter performs a
 * best-effort extraction of the *public* video page / its embedded state
 * (`SIGI_STATE`) and labels every result `source: "WEB"`. When the page is a
 * challenge/login wall it reports UNAVAILABLE honestly.
 */
export class TikTokProvider implements SocialProvider {
  readonly platform: ProviderPlatform = "TIKTOK";

  validateUrl(rawUrl: string): UrlValidationResult {
    const url = rawUrl.trim();
    const full = url.match(TT_FULL);
    if (full) {
      return {
        valid: true,
        platform: "TIKTOK",
        kind: "SHORT",
        externalId: full[2],
        normalizedUrl: `https://www.tiktok.com/@${full[1]}/video/${full[2]}`,
      };
    }
    const short = url.match(TT_SHORT);
    if (short) {
      return {
        valid: true,
        platform: "TIKTOK",
        kind: "SHORT",
        externalId: short[1],
        normalizedUrl: `https://www.tiktok.com/t/${short[1]}/`,
      };
    }
    const vm = url.match(TT_VM);
    if (vm) {
      return {
        valid: true,
        platform: "TIKTOK",
        kind: "SHORT",
        externalId: vm[1],
        normalizedUrl: `https://vm.tiktok.com/${vm[1]}/`,
      };
    }
    return {
      valid: false,
      error: `Unsupported TikTok URL: ${url}`,
    };
  }

  async getContentMetadata(): Promise<ContentMetadata> {
    // Metadata is populated during getMetrics from the public page.
    return {};
  }

  async getMetrics(input: ProviderInput): Promise<CollectionResult> {
    const isVideolink =
      /tiktok\.com\/@[\w.-]+\/video\/\d+/.test(input.url) ||
      /^\d+$/.test(input.externalId);
    const pageUrl = isVideolink
      ? `https://www.tiktok.com/@tiktok/video/${input.externalId}`
      : input.url;

    const html = await fetchHtml(pageUrl, { userAgent: WEB_UA });
    if (!html) {
      return {
        status: "FAILED",
        error: "Could not load the TikTok video page.",
      };
    }

    const item = parseSigiItem(html);
    if (!item) {
      return {
        status: "UNAVAILABLE",
        error:
          "TikTok's public page did not expose the video's counters (challenge or login wall). Reported Unavailable instead of bypassing TikTok's protections.",
      };
    }

    const stats = (item.stats ?? {}) as Record<string, unknown>;
    const author = (item.author ?? {}) as Record<string, unknown>;
    const cover = (item.media as { cover?: { urlList?: string[] } } | undefined)?.cover?.urlList;
    const views = safeNumber(stats.playCount);
    const likes = safeNumber(stats.diggCount);
    const comments = safeNumber(stats.commentCount);

    if (views === null && likes === null && comments === null) {
      return {
        status: "UNAVAILABLE",
        error: "TikTok's public page exposed no engagement counters for this video.",
      };
    }

    return {
      status: "COMPLETED",
      source: "WEB",
      metadata: {
        title: safeString(item.desc) ?? undefined,
        caption: safeString(item.desc)?.slice(0, 500) ?? undefined,
        accountName: (
          safeString((author.uniqueId as string | undefined)?.replace(/^@/, "")) ??
          safeString(author.nickname)
        ) ?? undefined,
        thumbnailUrl: cover?.[0],
        publishedAt: parseUnixSeconds(item.createTime),
        kind: "SHORT",
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

/**
 * Parses the `SIGI_STATE` JSON embedded in a TikTok public page and pulls out
 * the video detail object (`webapp.video-detail.itemInfo.itemStruct`, with a
 * fallback to the legacy `ItemModule` map).
 */
function parseSigiItem(html: string): Record<string, unknown> | null {
  const re = /<script\b[^>]*id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/i;
  const match = html.match(re);
  if (!match) return null;
  let state: Record<string, unknown>;
  try {
    state = JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }

  const scope = (state.__DEFAULT_SCOPE__ ?? state) as Record<string, unknown>;
  const videoDetail = scope["webapp.video-detail"] as
    | { itemInfo?: { itemStruct?: Record<string, unknown> } }
    | undefined;
  if (videoDetail?.itemInfo?.itemStruct) {
    return videoDetail.itemInfo.itemStruct;
  }
  const itemModule = state.ItemModule as Record<string, unknown> | undefined;
  if (itemModule) {
    const first = Object.values(itemModule)[0];
    if (first && typeof first === "object") return first as Record<string, unknown>;
  }
  return null;
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned !== "" ? cleaned : null;
}

function parseUnixSeconds(value: unknown): Date | null {
  const seconds =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (Number.isNaN(seconds) || seconds <= 0) return null;
  const d = new Date(seconds * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}