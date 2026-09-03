import { sleep } from "@/lib/utils";
import {
  adminUsersSeed,
  adminPayoutsSeed,
  adminGmvSeriesSeed,
} from "@/lib/mock-data/admin.seed";
import { allClips } from "@/lib/mock-data/clip-store";
import { transactionsSeed } from "@/lib/mock-data/accounts.seed";
import { allCampaigns, visibleCampaigns, removeCampaign } from "@/lib/mock-data/campaign-store";
import type {
  AdminOverview,
  AdminPayout,
  AdminService,
  AdminUserRow,
  Campaign,
  CampaignStatus,
  Clip,
  ModerationReview,
  NewCampaignInput,
  SubmissionFilter,
  TimeSeriesPoint,
  Transaction,
  UpdateCampaignInput,
} from "@/lib/services/types";

const LATENCY = 300;

const clipCreatorMap: Record<string, string> = {
  "u-01": "creator-a",
  "u-02": "creator-b",
  "u-03": "creator-c",
  "u-04": "creator-d",
  "u-05": "creator-e",
  "u-06": "creator-f",
  "u-07": "creator-g",
  "u-08": "creator-h",
  "u-09": "creator-i",
  "u-10": "creator-j",
  "u-11": "creator-k",
  "u-12": "creator-l",
};

export class MockAdminService implements AdminService {
  private users: AdminUserRow[] = adminUsersSeed.map((u) => ({ ...u }));
  private payouts: AdminPayout[] = adminPayoutsSeed.map((p) => ({ ...p }));
  private campaigns = allCampaigns;

  async getOverview(): Promise<AdminOverview> {
    await sleep(LATENCY);
    return {
      totalUsers: 58_214,
      activeCreators: 52_000,
      brands: 1_880,
      activeCampaigns: 1_200,
      viewsTracked: 9_400_000_000,
      gmvMinor: 620_000_000,
      platformRevenueMinor: 74_400_000,
      pendingPayoutsMinor: 8_200_000,
      flaggedSubmissions: allClips().filter((c) => c.status === "flagged").length + 21,
    };
  }

  async getGmvSeries(): Promise<TimeSeriesPoint[]> {
    await sleep(LATENCY);
    return adminGmvSeriesSeed.map((p) => ({ ...p }));
  }

  async listSubmissions(filter?: SubmissionFilter): Promise<Clip[]> {
    await sleep(LATENCY);
    let list = [...allClips()];
    if (filter?.campaignId) {
      list = list.filter((c) => c.campaignId === filter.campaignId);
    }
    if (filter?.status && filter.status !== "all") {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.campaignName.toLowerCase().includes(q) ||
          c.creatorName.toLowerCase().includes(q) ||
          c.creatorHandle.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async reviewSubmission(
    clipId: string,
    action: ModerationReview["action"],
    notes: string,
    rejectionReason?: string
  ): Promise<void> {
    await sleep(450);
    const clip = allClips().find((c) => c.id === clipId);
    if (!clip) throw new Error("That submission no longer exists in the queue.");
    if (action === "reject" && !rejectionReason?.trim()) {
      throw new Error("A rejection reason is required so the creator knows what to fix.");
    }
    const nextStatus: Record<ModerationReview["action"], Clip["status"]> = {
      approve: "approved",
      reject: "rejected",
      flag: "flagged",
      request_changes: "under_review",
    };
    clip.status = nextStatus[action];
    if (action === "reject") {
      clip.rejectionReason = rejectionReason!.trim();
    } else if (action === "approve") {
      clip.rejectionReason = undefined;
    }
    if (notes.trim()) {
      if (!clip.fraudScore) {
        clip.fraudScore = { score: 10, level: "LOW", signals: [], note: notes.trim() };
      } else {
        clip.fraudScore = { ...clip.fraudScore, note: notes.trim() };
      }
    }
  }

  async listFraudQueue(): Promise<Clip[]> {
    await sleep(LATENCY);
    return [...allClips()]
      .sort((a, b) => (b.fraudScore?.score ?? 0) - (a.fraudScore?.score ?? 0))
      .filter((c) => c.fraudScore !== undefined);
  }

  async updateFraudNote(clipId: string, note: string): Promise<void> {
    await sleep(300);
    const clip = allClips().find((c) => c.id === clipId);
    if (!clip) throw new Error("We could not find that submission.");
    clip.fraudScore = {
      score: clip.fraudScore?.score ?? 10,
      level: clip.fraudScore?.level ?? "LOW",
      signals: clip.fraudScore?.signals ?? [],
      note,
    };
  }

  async listUsers(search?: string): Promise<AdminUserRow[]> {
    await sleep(LATENCY);
    if (!search) return [...this.users];
    const q = search.toLowerCase();
    return this.users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  async listRecentSignups(limit = 5): Promise<AdminUserRow[]> {
    await sleep(LATENCY);
    return [...this.users]
      .sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1))
      .slice(0, limit);
  }

  async getUser(id: string): Promise<AdminUserRow> {
    await sleep(LATENCY);
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error("We could not find that user.");
    return { ...user };
  }

  async getUserCampaigns(id: string): Promise<string[]> {
    await sleep(LATENCY);
    const clipCreatorId = clipCreatorMap[id];
    if (!clipCreatorId) return [];
    const clips = allClips();
    const names = new Set<string>();
    for (const clip of clips) {
      if (clip.creatorId === clipCreatorId) {
        names.add(clip.campaignName);
      }
    }
    return [...names];
  }

  async banUser(id: string): Promise<void> {
    await sleep(LATENCY);
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error("We could not find that user.");
    user.status = "banned";
  }

  async kickUser(id: string): Promise<void> {
    await sleep(LATENCY);
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("We could not find that user.");
    this.users.splice(idx, 1);
  }

  async listPayments(): Promise<Transaction[]> {
    await sleep(LATENCY);
    return transactionsSeed.map((t) => ({ ...t }));
  }

  async listPayouts(): Promise<AdminPayout[]> {
    await sleep(LATENCY);
    return [...this.payouts].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
  }

  async releasePayout(id: string): Promise<void> {
    await sleep(LATENCY);
    const payout = this.payouts.find((p) => p.id === id);
    if (!payout) throw new Error("That payout request no longer exists.");
    if (payout.status === "paid") throw new Error("That payout has already been released.");
    payout.status = "paid";
  }

  async listCampaigns(search?: string): Promise<Campaign[]> {
    await sleep(LATENCY);
    const visible = visibleCampaigns();
    if (!search) return [...visible];
    const q = search.toLowerCase();
    return visible.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.brandName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    await sleep(LATENCY);
    return visibleCampaigns().find((c) => c.id === id) ?? null;
  }

  async createCampaign(input: NewCampaignInput): Promise<Campaign> {
    await sleep(LATENCY);
    if (!input.name.trim()) throw new Error("Campaign name is required.");
    const ends = new Date();
    ends.setDate(ends.getDate() + input.durationDays);
    const campaign: Campaign = {
      id: `cmp-${Date.now()}`,
      brandId: "brand-admin",
      brandName: "Clip Matrix",
      brandInitial: "C",
      name: input.name.trim(),
      category: input.category,
      status: "ACTIVE",
      daysRemaining: input.durationDays,
      endsAt: ends.toISOString(),
      ratePer100kMinor: input.ratePer100kMinor,
      budgetMinor: input.budgetMinor,
      spentMinor: 0,
      maxPayoutMinor: input.maxPayoutMinor,
      minViews: input.minViews,
      platforms: input.platforms,
      creatorCount: 0,
      description: input.description.trim(),
      longDescription: input.description.trim(),
      rulesSummary:
        input.forbiddenContent.trim() ||
        "Standard Clip Matrix rules apply. Review submissions before payouts release.",
      contentRequirements: [],
      prohibitedContent: input.forbiddenContent
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      creatorRequirements: [`Creators need at least ${input.minCreatorFollowers.toLocaleString()} followers`],
      requiredHashtags: input.requiredHashtags,
      requiredMentions: input.requiredMentions,
      requiredPhrases: input.requiredPhrases,
      totalViews: 0,
      totalClips: 0,
      engagementRate: 0,
      cpmMinor: Math.max(20, Math.round(input.ratePer100kMinor / 90)),
      exampleClips: [],
      faqs: [],
      geoBreakdown: [],
      spendHistory: [],
      performanceSeries: [],
      createdAt: new Date().toISOString(),
    };
    this.campaigns.unshift(campaign);
    return campaign;
  }

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    await sleep(LATENCY);
    const c = this.campaigns.find((x) => x.id === id);
    if (!c) throw new Error("We could not find that campaign.");
    if (input.name !== undefined) c.name = input.name.trim();
    if (input.category !== undefined) c.category = input.category;
    if (input.description !== undefined) {
      c.description = input.description.trim();
      c.longDescription = input.description.trim();
    }
    if (input.longDescription !== undefined) c.longDescription = input.longDescription;
    if (input.platforms !== undefined) c.platforms = input.platforms;
    if (input.requiredPhrases !== undefined) c.requiredPhrases = input.requiredPhrases;
    if (input.requiredHashtags !== undefined) c.requiredHashtags = input.requiredHashtags;
    if (input.requiredMentions !== undefined) c.requiredMentions = input.requiredMentions;
    if (input.forbiddenContent !== undefined) {
      c.prohibitedContent = input.forbiddenContent.split("\n").map((l) => l.trim()).filter(Boolean);
    }
    if (input.budgetMinor !== undefined) c.budgetMinor = input.budgetMinor;
    if (input.ratePer100kMinor !== undefined) c.ratePer100kMinor = input.ratePer100kMinor;
    if (input.maxPayoutMinor !== undefined) c.maxPayoutMinor = input.maxPayoutMinor;
    if (input.minViews !== undefined) c.minViews = input.minViews;
    if (input.coverUrl !== undefined) c.coverUrl = input.coverUrl || undefined;
    if (input.status !== undefined) c.status = input.status;
    return c;
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await sleep(LATENCY);
    const idx = this.campaigns.findIndex((x) => x.id === campaignId);
    if (idx === -1) throw new Error("We could not find that campaign.");
    removeCampaign(campaignId);
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await sleep(LATENCY);
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error("We could not find that campaign.");
    c.status = status;
  }
}
