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
} from "@/lib/providers/types";
import { prisma } from "@/lib/db";

const X_STATUS = /(?:x|twitter)\.com\/([\w_]{1,15})\/status\/(\d+)/;

/**
 * X (Twitter) provider.
 *
 * X has no public-official metrics API for arbitrary posts. This adapter reads
 * the public syndication JSON document (the same data X serves to embed
 * widgets) which includes `view_count` / `like_count` / `reply_count` for
 * public posts. Results are labeled `source: "WEB"`. Deleted or protected
 * posts are reported honestly rather than bypassed.
 */
export class XProvider implements SocialProvider {
  readonly platform: ProviderPlatform = "X";

  validateUrl(rawUrl: string): UrlValidationResult {
    const url = rawUrl.trim();
    const status = url.match(X_STATUS);
    if (status) {
      return {
        valid: true,
        platform: "X",
        kind: "TWEET",
        externalId: status[2],
        normalizedUrl: `https://x.com/${status[1]}/status/${status[2]}`,
      };
    }
    return {
      valid: false,
      error: `Unsupported X/Twitter URL: ${url}`,
    };
  }

  async getContentMetadata(): Promise<ContentMetadata> {
    // Metadata is populated during getMetrics from the public tweet document.
    return {};
  }

  async getMetrics(input: ProviderInput): Promise<CollectionResult> {
    const url = `https://cdn.syndication.twimg.com/tweet-result?id=${input.externalId}&lang=en`;
    let json: Record<string, unknown>;
    try {
      const { body } = await fetchJson(url, { referrer: "https://x.com/" });
      json = body;
    } catch (err) {
      if (err instanceof RateLimitedError) throw err;
      return {
        status: "FAILED",
        error: "Could not load the public post document.",
      };
    }

    if ((json.error as { message?: string } | undefined)?.message) {
      const message = (json.error as { message: string }).message;
      return {
        status: "UNAVAILABLE",
        error: `Post metrics unavailable: ${message}`,
      };
    }

    const user = (json.user ?? {}) as Record<string, unknown>;
    const views = safeNumber(json.view_count);
    const likes = safeNumber(json.like_count);
    const comments = safeNumber(json.reply_count);
    const retweets = safeNumber(json.retweet_count);
    const title = safeString(json.full_text) ?? safeString(json.text);

    if (views === null && likes === null && comments === null && retweets === null) {
      return {
        status: "UNAVAILABLE",
        error: "The public post document did not expose engagement counters.",
      };
    }

    return {
      status: "COMPLETED",
      source: "WEB",
      metadata: {
        title: title?.slice(0, 280) ?? undefined,
        caption: title?.slice(0, 500) ?? undefined,
        accountName: safeString(user.screen_name) ?? undefined,
        publishedAt: parseTwitterDate(json.created_at),
        kind: "TWEET",
      },
      metrics: {
        views,
        likes,
        comments,
      },
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
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned !== "" && cleaned.toLowerCase() !== "null" ? cleaned : null;
}

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Parses Twitter's `ddd MMM dd HH:mm:ss +0000 yyyy` timestamp format. */
function parseTwitterDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const re = /^(\w{3}) (\w{3}) (\d{1,2}) (\d{2}):(\d{2}):(\d{2}) \+0000 (\d{4})$/;
  const match = value.match(re);
  if (!match) return null;
  const month = MONTHS[match[2]];
  if (month === undefined) return null;
  const d = new Date(
    Number(match[7]),
    month,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
  return Number.isNaN(d.getTime()) ? null : d;
}