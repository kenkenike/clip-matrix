import {
  type SocialProvider,
  type ProviderPlatform,
  type UrlValidationResult,
  RateLimitedError,
} from "@/lib/providers/types";
import { YouTubeProvider } from "@/lib/providers/youtube";
import { InstagramProvider } from "@/lib/providers/instagram";
import { TikTokProvider } from "@/lib/providers/tiktok";
import { XProvider } from "@/lib/providers/x";

let cached: Record<ProviderPlatform, SocialProvider> | null = null;

/** Returns lazily-initialized provider singletons. */
export function getProviders(): Record<ProviderPlatform, SocialProvider> {
  if (!cached) {
    cached = {
      YOUTUBE: new YouTubeProvider(),
      INSTAGRAM: new InstagramProvider(),
      TIKTOK: new TikTokProvider(),
      X: new XProvider(),
    };
  }
  return cached;
}

export function resetProviders() {
  cached = null;
}

/**
 * Detects the platform for a raw URL and returns the matching adapter.
 */
export function providerForUrl(rawUrl: string): SocialProvider {
  const providers = getProviders();
  for (const provider of Object.values(providers)) {
    if (provider.validateUrl(rawUrl).valid) return provider;
  }
  throw new Error(
    "Unrecognized URL. Provide a YouTube, Instagram, TikTok, or X post URL.",
  );
}

/**
 * Validates a raw URL and returns a normalized result for any supported platform.
 */
export function validateAnyUrl(rawUrl: string): UrlValidationResult {
  const providers = getProviders();
  for (const provider of Object.values(providers)) {
    const result = provider.validateUrl(rawUrl);
    if (result.valid) return result;
  }
  return {
    valid: false,
    error:
      "Unrecognized URL. Provide a YouTube video/channel URL, Instagram post/reel URL, TikTok video URL, or X/Twitter post URL.",
  };
}

export { RateLimitedError, type SocialProvider, type ProviderPlatform };