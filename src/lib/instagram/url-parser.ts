import type { InstagramContentType } from "./types";

interface ParsedInstagramUrl {
  valid: boolean;
  type: InstagramContentType | null;
  username: string | null;
  shortcode: string | null;
  error: string | null;
}

const URL_PATTERNS = {
  post: /^instagram\.com\/p\/([A-Za-z0-9_-]+)/,
  reel: /^instagram\.com\/reels?\/([A-Za-z0-9_-]+)/,
  profile: /^instagram\.com\/([A-Za-z0-9_.]+)\/?$/,
};

export function parseInstagramUrl(raw: string): ParsedInstagramUrl {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { valid: false, type: null, username: null, shortcode: null, error: "Invalid URL format" };
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "instagram.com") {
    return { valid: false, type: null, username: null, shortcode: null, error: "Not an Instagram URL" };
  }

  const path = url.pathname.replace(/\/+$/, "");

  for (const [type, pattern] of Object.entries(URL_PATTERNS)) {
    const match = path.match(pattern);
    if (match) {
      if (type === "profile") {
        const username = match[1];
        if (["p", "reels", "reel", "stories", "explore", "accounts", "directory", "about", "legal", "privacy", "terms", "settings"].includes(username)) {
          continue;
        }
        return { valid: true, type: "profile", username, shortcode: null, error: null };
      }
      return { valid: true, type: type as InstagramContentType, username: null, shortcode: match[1], error: null };
    }
  }

  return { valid: false, type: null, username: null, shortcode: null, error: "Could not identify post, reel, or profile URL" };
}

export function getWebProfileInfoUrl(username: string): string {
  return `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
}

export function getMediaInfoUrl(shortcode: string): string {
  return `https://www.instagram.com/api/v1/media/info/?shortcode=${shortcode}`;
}
