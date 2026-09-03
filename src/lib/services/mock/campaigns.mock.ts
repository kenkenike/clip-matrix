import { sleep } from "@/lib/utils";
import type {
  Campaign,
  CampaignFilter,
  CampaignRules,
  CampaignService,
  NewCampaignInput,
  UpdateCampaignInput,
} from "@/lib/services/types";
import { allCampaigns, visibleCampaigns, removeCampaign } from "@/lib/mock-data/campaign-store";

const LATENCY = 350;

function matches(c: Campaign, f: CampaignFilter): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = `${c.name} ${c.brandName} ${c.category}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.category && f.category !== "all" && c.category !== f.category) return false;
  if (f.platform && f.platform !== "all" && !c.platforms.includes(f.platform)) return false;
  if (f.status && f.status !== "all" && c.status !== f.status) return false;
  if (f.minRatePer100kMinor !== undefined && c.ratePer100kMinor < f.minRatePer100kMinor) return false;
  if (f.minViews !== undefined && c.minViews < f.minViews) return false;
  return true;
}

function sortCampaigns(list: Campaign[], sort?: CampaignFilter["sort"]): Campaign[] {
  const copy = [...list];
  switch (sort) {
    case "rate_desc":
      return copy.sort((a, b) => b.ratePer100kMinor - a.ratePer100kMinor);
    case "ending_soon":
      return copy.sort((a, b) => a.daysRemaining - b.daysRemaining);
    case "popular":
      return copy.sort((a, b) => b.creatorCount - a.creatorCount);
    case "newest":
      return copy.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    default:
      return copy;
  }
}

export class MockCampaignService implements CampaignService {
  private campaigns = allCampaigns;

  async listCampaigns(filter?: CampaignFilter): Promise<Campaign[]> {
    await sleep(LATENCY);
    const visible = visibleCampaigns();
    return sortCampaigns(visible.filter((c) => matches(c, filter ?? {})), filter?.sort);
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    await sleep(LATENCY);
    return visibleCampaigns().find((c) => c.id === id) ?? null;
  }

  async getRules(campaignId: string): Promise<CampaignRules | null> {
    await sleep(250);
    const c = visibleCampaigns().find((x) => x.id === campaignId);
    if (!c) return null;
    return {
      campaignId: c.id,
      allowedPlatforms: c.platforms,
      requiredPhrases: c.requiredPhrases,
      requiredHashtags: c.requiredHashtags,
      requiredMentions: c.requiredMentions,
      minCreatorFollowers: 1_000,
      minViews: c.minViews,
      forbiddenContent: c.prohibitedContent,
      submissionWindowDays: c.daysRemaining,
    };
  }

  async joinCampaign(campaignId: string): Promise<void> {
    await sleep(LATENCY);
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error("That campaign is no longer available.");
    if (c.status === "DRAFT") throw new Error("This campaign has not launched yet. Check back soon.");
    c.creatorCount += 1;
  }

  async createCampaign(input: NewCampaignInput): Promise<Campaign> {
    await sleep(LATENCY);
    if (!input.name.trim()) throw new Error("Give your campaign a name before launching.");
    const ends = new Date();
    ends.setDate(ends.getDate() + input.durationDays);
    const campaign: Campaign = {
      id: `cmp-${Date.now()}`,
      brandId: "brand-northbeam",
      brandName: "Northbeam Labs",
      brandInitial: "N",
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

  async updateStatus(campaignId: string, status: Campaign["status"]): Promise<void> {
    await sleep(LATENCY);
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error("We could not find that campaign.");
    c.status = status;
  }

  async increaseBudget(campaignId: string, amountMinor: number): Promise<Campaign> {
    await sleep(LATENCY);
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error("We could not find that campaign.");
    c.budgetMinor += amountMinor;
    return c;
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
}
