/**
 * Instagram shortcode <-> numeric Media ID conversion.
 *
 * Instagram encodes the numeric media id into the URL shortcode as a base64
 * (URL-safe) big-endian number using this alphabet. Decoding is deterministic —
 * it is Meta's own encoding, not scraping. The numeric media id is then what
 * is sent to the authorized Graph API endpoint.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const CHAR_TO_VALUE = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) {
  CHAR_TO_VALUE.set(ALPHABET[i], i);
}

const BIG_ZERO = BigInt(0);
const BIG_BASE = BigInt(64);

/** Numeric Graph API media id for a shortcode, or null when the shortcode is malformed. */
export function shortcodeToMediaId(shortcode: string): string | null {
  const clean = (shortcode ?? "").trim();
  if (clean === "") return null;
  let id = BIG_ZERO;
  for (const ch of clean) {
    const v = CHAR_TO_VALUE.get(ch);
    if (v === undefined) return null;
    id = id * BIG_BASE + BigInt(v);
  }
  return id.toString();
}

/** Shortcode for a numeric media id (used for tests and admin debugging). */
export function mediaIdToShortcode(mediaId: string | number): string | null {
  let n = BigInt(String(mediaId).trim());
  if (n < BIG_ZERO) return null;
  let out = "";
  do {
    out = ALPHABET[Number(n % BIG_BASE)] + out;
    n /= BIG_BASE;
  } while (n > BIG_ZERO);
  return out;
}