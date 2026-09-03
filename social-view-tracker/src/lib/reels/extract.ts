/**
 * Instagram Reel URL parsing — pure helpers, no I/O.
 *
 * - `extractInstagramReelId(url)` returns just the shortcode identifier.
 * - `normalizeReelUrl(shortcode)` rebuilds a canonical URL.
 *
 * Never stores query parameters as the identifier.
 */

const REEL_PATTERNS = [
  /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)(?:\/|$)/,
  /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)\?/,
  /instagram\.com\/reel(?:s)?\/([A-Za-z0-9_-]+).*/i,
];

export type ExtractReelIdResult =
  | { ok: true; reelId: string; normalizedUrl: string }
  | { ok: false; error: "NOT_INSTAGRAM" | "NOT_REEL" | "MISSING_ID" };

/** True when the URL points at an instagram.com host. */
export function isInstagramUrl(raw: string): boolean {
  try {
    const host = new URL(raw.trim()).hostname.toLowerCase();
    return host === "instagram.com" || host.endsWith(".instagram.com");
  } catch {
    return false;
  }
}

/** True when the URL is an Instagram reel/post/tv media page. */
export function isInstagramMediaUrl(raw: string): boolean {
  const id = extractInstagramReelId(raw);
  return id.ok;
}

/**
 * Extracts the Reel identifier (shortcode) from an Instagram URL.
 *
 * Supports e.g.:
 *   https://www.instagram.com/reel/C123456789/
 *   https://instagram.com/reel/C123456789/
 *   https://www.instagram.com/reel/C123456789/?igsh=abc
 */
export function extractInstagramReelId(raw: string): ExtractReelIdResult {
  const url = (raw ?? "").trim();
  if (!url) return { ok: false, error: "MISSING_ID" };
  if (!isInstagramUrl(url)) return { ok: false, error: "NOT_INSTAGRAM" };

  for (const pattern of REEL_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const reelId = match[1];
      // A personal-page slug like /reels/ or /p/ is not an identifier.
      if (!/^(reel|reels|p|tv)$/i.test(reelId)) {
        return { ok: true, reelId, normalizedUrl: `https://www.instagram.com/reel/${reelId}/` };
      }
      return { ok: false, error: "MISSING_ID" };
    }
  }
  return { ok: false, error: "NOT_REEL" };
}

/** Canonical reel URL for a shortcode. */
export function normalizeReelUrl(reelId: string): string {
  return `https://www.instagram.com/reel/${reelId}/`;
}