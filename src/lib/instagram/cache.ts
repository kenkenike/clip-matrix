import type { InstagramInsightResult } from "./types";

interface CacheEntry {
  result: InstagramInsightResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

export function getCached(url: string): InstagramInsightResult | null {
  const key = cacheKey(url);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCache(url: string, result: InstagramInsightResult, ttlMs: number = DEFAULT_TTL_MS): void {
  const key = cacheKey(url);
  cache.set(key, { result, expiresAt: Date.now() + ttlMs });
}

export function cacheSize(): number {
  return cache.size;
}
