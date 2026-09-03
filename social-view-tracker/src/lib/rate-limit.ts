/**
 * Lightweight in-memory sliding-window rate limiter for API routes.
 *
 * Single-process (local/dev) friendly; swap for a Redis-backed limiter when
 * the app runs in a distributed deployment.
 */

type Bucket = { hits: number[]; resetAt: number };

const buckets = new Map<string, Bucket>();

export const RATE_LIMIT_MAX = clampNumber(
  process.env.REEL_RATE_LIMIT_MAX_REQUESTS,
  120,
);
export const RATE_LIMIT_WINDOW_MS = clampNumber(
  process.env.REEL_RATE_LIMIT_WINDOW_MS,
  60_000,
);

function clampNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function prune() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  if (buckets.size > 10_000) {
    // Hard cap on tracked keys under memory pressure.
    const keys = [...buckets.keys()];
    for (const key of keys.slice(0, keys.length - 10_000)) buckets.delete(key);
  }
}

/**
 * Records one request attempt for `key` and returns whether it is allowed.
 * `limit` per `windowMs` (e.g. 120 requests / 60s).
 */
export function rateLimit(key: string, limit = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS): boolean {
  const now = Date.now();
  prune();
  const bucket = buckets.get(key) ?? { hits: [], resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.hits = [];
    bucket.resetAt = now + windowMs;
  }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return true;
}