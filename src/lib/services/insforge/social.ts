import type {
  SocialPlatformService,
  SocialPlatformName,
  DetectedPostMetrics,
} from "@/lib/services/types";

const PLATFORMS = [
  { platform: "tiktok" as SocialPlatformName, label: "TikTok", connected: true },
  { platform: "instagram" as SocialPlatformName, label: "Instagram", connected: true },
  { platform: "youtube" as SocialPlatformName, label: "YouTube", connected: true },
  { platform: "x" as SocialPlatformName, label: "X (Twitter)", connected: false },
];

export class MockSocialPlatformService implements SocialPlatformService {
  async listSupported() {
    return PLATFORMS;
  }

  async detectPost(url: string, platform: SocialPlatformName): Promise<DetectedPostMetrics> {
    // Mock detection for TikTok and X (Instagram/YouTube use real scrapers)
    const views = Math.floor(Math.random() * 500000) + 10000;
    const engagement = Math.random() * 0.08 + 0.02;
    return {
      platform,
      accountHandle: `@creator_${platform}`,
      views,
      likes: Math.floor(views * engagement),
      comments: Math.floor(views * engagement * 0.15),
      shares: Math.floor(views * engagement * 0.1),
      postedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    };
  }

  async validateUrl(url: string, platform: SocialPlatformName): Promise<boolean> {
    const patterns: Record<SocialPlatformName, RegExp> = {
      tiktok: /tiktok\.com|vm\.tiktok\.com/,
      instagram: /instagram\.com\/(reel|p|tv)/,
      youtube: /youtube\.com|youtu\.be/,
      x: /x\.com|twitter\.com/,
    };
    return patterns[platform].test(url);
  }
}
