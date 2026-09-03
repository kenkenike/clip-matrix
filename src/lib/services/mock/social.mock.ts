import { sleep } from "@/lib/utils";
import { accountsSeed } from "@/lib/mock-data/accounts.seed";
import type {
  DetectedPostMetrics,
  SocialPlatformName,
  SocialPlatformService,
} from "@/lib/services/types";

const LATENCY = 1_100;

const platformDomains: Record<SocialPlatformName, string> = {
  tiktok: "tiktok.com",
  instagram: "instagram.com",
  youtube: "youtube.com",
  x: "x.com",
};

export class MockSocialPlatformService implements SocialPlatformService {
  async listSupported() {
    await sleep(200);
    return [
      { platform: "tiktok" as const, label: "TikTok", connected: true },
      { platform: "instagram" as const, label: "Instagram Reels", connected: true },
      { platform: "youtube" as const, label: "YouTube Shorts", connected: true },
      { platform: "x" as const, label: "X", connected: false },
    ];
  }

  async validateUrl(url: string, platform: SocialPlatformName): Promise<boolean> {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes(platformDomains[platform]);
    } catch {
      return false;
    }
  }

  async detectPost(url: string, platform: SocialPlatformName): Promise<DetectedPostMetrics> {
    await sleep(LATENCY);
    let hash = 0;
    for (let i = 0; i < url.length; i++) hash = (hash * 33 + url.charCodeAt(i)) | 0;
    const abs = Math.abs(hash);
    const valid = await this.validateUrl(url, platform);
    if (!valid) {
      throw new Error(
        `That link does not look like a public ${platformMetaLabel(platform)} post. Double-check the URL and try again.`
      );
    }
    return {
      platform,
      accountHandle: "@alexclips",
      views: 24_000 + (abs % 480_000),
      likes: 1_800 + (abs % 42_000),
      comments: 90 + (abs % 2_400),
      shares: 60 + (abs % 1_800),
      postedAt: new Date(Date.now() - ((abs % 6) + 1) * 86_400_000).toISOString(),
    };
  }
}

function platformMetaLabel(platform: SocialPlatformName): string {
  switch (platform) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "x":
      return "X";
  }
}
