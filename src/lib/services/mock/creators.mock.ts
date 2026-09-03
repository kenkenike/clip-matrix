import { sleep } from "@/lib/utils";
import { seriesForRanges } from "@/lib/mock-data/series.seed";
import { allClips } from "@/lib/mock-data/clip-store";
import { currentCreatorSeed } from "@/lib/mock-data/creators.seed";
import { accountsSeed } from "@/lib/mock-data/accounts.seed";
import { earningsSeed } from "@/lib/mock-data/finance.seed";
import { notificationsSeed } from "@/lib/mock-data/content.seed";
import type {
  Clip,
  CreatorOverview,
  CreatorProfile,
  CreatorService,
  LeaderboardEntry,
  NotificationItem,
  SocialAccount,
  SocialAccountStatus,
  SocialPlatformName,
  SubmitClipInput,
} from "@/lib/services/types";
import { creatorDirectorySeed, toLeaderboard } from "@/lib/mock-data/creators.seed";

const LATENCY = 400;

export class MockCreatorService implements CreatorService {
  private accounts: SocialAccount[] = accountsSeed.map((a) => ({ ...a }));

  async getCurrentCreator(): Promise<CreatorProfile> {
    await sleep(200);
    return { ...currentCreatorSeed };
  }

  async getOverview(): Promise<CreatorOverview> {
    await sleep(LATENCY);
    const mine = allClips().filter((c) => c.creatorId === "creator-a");
    return {
      displayName: currentCreatorSeed.displayName.split(" ")[0],
      metrics: {
        totalViews: 12_400_000,
        totalEarningsMinor: 482_040,
        activeCampaigns: 8,
        pendingEarningsMinor: 62_000,
      },
      earningsSeries: seriesForRanges(
        {
          "7D": { base: 4_800, amplitude: 0.35, growth: 0.05, seed: 11 },
          "30D": { base: 3_900, amplitude: 0.45, growth: 0.03, seed: 12 },
          "90D": { base: 2_800, amplitude: 0.5, growth: 0.02, seed: 13 },
          ALL: { base: 900, amplitude: 0.6, growth: 0.008, seed: 14 },
        },
        "compact"
      ),
      recentClips: mine.slice(0, 5),
      recentEarnings: earningsSeed.slice(0, 5),
    };
  }

  async getSocialAccounts(): Promise<SocialAccount[]> {
    await sleep(LATENCY);
    return this.accounts.map((a) => ({ ...a }));
  }

  async setAccountStatus(
    platform: SocialPlatformName,
    status: SocialAccountStatus
  ): Promise<SocialAccount> {
    await sleep(status === "connecting" ? 1_500 : 300);
    const account = this.accounts.find((a) => a.platform === platform);
    if (!account) throw new Error("We could not find that platform.");
    if (status === "verified") {
      account.username = `@${currentCreatorSeed.handle.replace("@", "")}`;
      account.followers = account.followers || 42_000;
      account.connectedAt = new Date().toISOString();
    }
    if (status === "not_connected") {
      account.username = null;
      account.followers = 0;
      account.connectedAt = null;
    }
    account.status = status;
    return { ...account };
  }

  async getLeaderboard(campaignId: string): Promise<LeaderboardEntry[]> {
    await sleep(LATENCY);
    return toLeaderboard(creatorDirectorySeed, campaignId || "nova-podcast");
  }

  async listMyClips(): Promise<Clip[]> {
    await sleep(LATENCY);
    return allClips().filter((c) => c.creatorId === "creator-a");
  }

  async submitClip(input: SubmitClipInput): Promise<Clip> {
    await sleep(600);
    if (!input.url.startsWith("http")) {
      throw new Error("Paste the full public URL of your post, including https://");
    }
    const clip: Clip = {
      id: `clip-${Date.now()}`,
      campaignId: input.campaignId,
      campaignName: input.campaignId,
      brandName: "",
      creatorId: "creator-a",
      creatorName: currentCreatorSeed.displayName,
      creatorHandle: currentCreatorSeed.handle,
      platform: input.platform,
      url: input.url,
      views: Math.round(20_000 + Math.random() * 180_000),
      likes: Math.round(2_000 + Math.random() * 20_000),
      comments: Math.round(100 + Math.random() * 900),
      shares: Math.round(80 + Math.random() * 700),
      postedAt: new Date(Date.now() - 86_400_000).toISOString(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      earnedMinor: 0,
    };
    allClips().unshift(clip);
    return clip;
  }

  async getNotifications(): Promise<NotificationItem[]> {
    await sleep(250);
    return notificationsSeed.map((n) => ({ ...n }));
  }
}
