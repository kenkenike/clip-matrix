export type ProviderPlatform = "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "X";
export type ContentKind = "VIDEO" | "SHORT" | "LIVE" | "REEL" | "POST" | "TWEET" | "OTHER";
export type MetricSource = "OFFICIAL" | "WEB";

export type UrlValidationResult = {
  valid: boolean;
  platform?: ProviderPlatform;
  kind?: ContentKind;
  externalId?: string;
  normalizedUrl?: string;
  error?: string;
};

export type ContentMetadata = {
  title?: string;
  caption?: string;
  accountName?: string;
  thumbnailUrl?: string;
  publishedAt?: Date | null;
  kind?: ContentKind;
};

export type MetricDatum = {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
};

export type CollectionResult = {
  status: "COMPLETED" | "UNAVAILABLE" | "RATE_LIMITED" | "FAILED";
  metadata?: ContentMetadata;
  metrics?: MetricDatum;
  error?: string;
  /**
   * Where the numbers came from: OFFICIAL = a documented platform API;
   * WEB = labeled extraction from the public page (best-effort, unofficial).
   */
  source?: MetricSource;
};

export type HistoricalPoint = {
  capturedAt: Date;
  views: number | null;
  likes: number | null;
  comments: number | null;
};

export type ProviderInput = {
  url: string;
  externalId: string;
  kind: ContentKind;
};

/**
 * Common interface implemented by every platform adapter. Adapters prefer
 * officially documented APIs. When official access is unavailable the adapter
 * may fall back to a best-effort extraction of the *public* page, which is
 * always labeled `source: "WEB"` so scraped numbers can never be mistaken for
 * verifiable API data. When nothing can be obtained legally the adapter
 * returns UNAVAILABLE — it never invents numbers.
 */
export interface SocialProvider {
  readonly platform: ProviderPlatform;
  validateUrl(rawUrl: string): UrlValidationResult;
  getContentMetadata(input: ProviderInput): Promise<ContentMetadata>;
  getMetrics(input: ProviderInput): Promise<CollectionResult>;
  getHistoricalMetrics(contentId: string): Promise<HistoricalPoint[]>;
}

/** A realistic browser-ish User-Agent for public-page fetches. */
export const WEB_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Fetches an HTML page with the given User-Agent. Returns the raw HTML string,
 * or null when the fetch fails / the status is not 2xx.
 */
export async function fetchHtml(
  url: string,
  opts?: { userAgent?: string; timeoutMs?: number },
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 15_000);
  try {
    const res = await fetch(url, {
      cache: "no-cache",
      signal: controller.signal,
      headers: {
        "User-Agent": opts?.userAgent ?? WEB_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export class RateLimitedError extends Error {
  readonly retryAfterSeconds?: number;
  readonly quotaExceeded: boolean;
  constructor(message: string, opts?: { retryAfterSeconds?: number; quotaExceeded?: boolean }) {
    super(message);
    this.name = "RateLimitedError";
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.quotaExceeded = opts?.quotaExceeded ?? false;
  }
}

/**
 * Fetch wrapper that classifies HTTP failures so callers can apply exponential
 * backoff for retryable errors and surface honest messages otherwise.
 */
export async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new Error("Network error while contacting the platform API.");
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    throw new RateLimitedError("Rate limited by the platform.", {
      retryAfterSeconds: retryAfter ? Number(retryAfter) || undefined : undefined,
    });
  }
  if (res.status >= 400) {
    if (isQuotaExceeded(body)) {
      throw new RateLimitedError("API quota exceeded.", { quotaExceeded: true });
    }
  }
  return { ok: res.ok, status: res.status, body };
}

function isQuotaExceeded(body: Record<string, unknown>): boolean {
  const errors = body?.error;
  if (Array.isArray(errors)) {
    return errors.some((e) => {
      const reason = (e as { reason?: string })?.reason ?? "";
      return reason.includes("quotaExceeded") || reason.includes("rateLimitExceeded");
    });
  }
  if (errors && typeof errors === "object") {
    const reason = (errors as { reason?: string; message?: string })?.reason ?? "";
    const message = (errors as { message?: string })?.message ?? "";
    return (
      reason.includes("quotaExceeded") ||
      reason.includes("rateLimitExceeded") ||
      message.includes("quota")
    );
  }
  return false;
}