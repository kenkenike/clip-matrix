import { sleep } from "@/lib/utils";
import { allCampaigns, visibleCampaigns } from "@/lib/mock-data/campaign-store";
import { creatorDirectorySeed } from "@/lib/mock-data/creators.seed";
import { platformSplitSeed } from "@/lib/mock-data/metrics.seed";
import { clipsSeed } from "@/lib/mock-data/clips.seed";
import { toLeaderboard } from "@/lib/mock-data/creators.seed";
import type {
  BrandOverview,
  BrandProfile,
  BrandService,
  Campaign,
  CreatorProfile,
  NewCampaignInput,
} from "@/lib/services/types";

const LATENCY = 450;

export class MockBrandService implements BrandService {
  private campaigns = allCampaigns;

  async getBrand(): Promise<BrandProfile> {
    await sleep(200);
    return {
      id: "brand-northbeam",
      userId: "user-brand",
      name: "Northbeam Labs",
      industry: "Media & Technology",
      website: "https://northbeam.io",
      description:
        "Northbeam Labs produces the Nova Podcast network and builds audience tools for modern media teams.",
      verified: true,
    };
  }

  async getOverview(): Promise<BrandOverview> {
    await sleep(LATENCY);
    return {
      brandName: "Northbeam Labs",
      metrics: {
        activeCampaigns: 3,
        totalSpendMinor: 1_460_000,
        totalViews: 41_200_000,
        creators: 1_204,
        engagementRate: 6.4,
        avgCpmMinor: 35,
      },
      campaignPerformance: [
        { label: "Mar", value: 2_100_000 },
        { label: "Apr", value: 3_400_000 },
        { label: "May", value: 5_800_000 },
        { label: "Jun", value: 7_900_000 },
        { label: "Jul", value: 10_400_000 },
        { label: "Aug", value: 11_600_000 },
      ],
      recentSubmissions: clipsSeed.slice(0, 6),
      platformSplit: platformSplitSeed,
      topCreators: toLeaderboard(creatorDirectorySeed, "brand-overview").slice(0, 5),
    };
  }

  async listBrandCampaigns(): Promise<Campaign[]> {
    await sleep(LATENCY);
    return visibleCampaigns().filter((c) => c.brandId === "brand-northbeam" || ["alpha-arena", "cartel-drop-04"].includes(c.id));
  }

  async getCampaignDetail(id: string): Promise<Campaign | null> {
    await sleep(LATENCY);
    const found = visibleCampaigns().find((c) => c.id === id) ?? null;
    if (!found) return null;
    return {
      ...found,
      performanceSeries:
        found.performanceSeries.length > 0
          ? found.performanceSeries
          : [
              { label: "W1", value: 120_000 },
              { label: "W2", value: 340_000 },
              { label: "W3", value: 620_000 },
              { label: "W4", value: 980_000 },
              { label: "W5", value: 1_420_000 },
              { label: "W6", value: 1_860_000 },
            ],
    };
  }

  async listCreators(search?: string): Promise<CreatorProfile[]> {
    await sleep(LATENCY);
    if (!search) return creatorDirectorySeed.map((c) => ({ ...c }));
    const q = search.toLowerCase();
    return creatorDirectorySeed
      .filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
      )
      .map((c) => ({ ...c }));
  }

  async launchCampaign(input: NewCampaignInput): Promise<Campaign> {
    await sleep(LATENCY);
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
      description: input.description.trim() || "New campaign from Northbeam Labs.",
      longDescription: input.description.trim() || "New campaign from Northbeam Labs.",
      rulesSummary: input.forbiddenContent.trim() || "Standard rules apply.",
      contentRequirements: [],
      prohibitedContent: input.forbiddenContent.split("\n").filter(Boolean),
      creatorRequirements: [],
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
}
