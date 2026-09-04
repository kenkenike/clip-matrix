import { insforge } from "@/lib/insforge";
import type {
  BrandOverview,
  BrandProfile,
  BrandService,
  Campaign,
  CampaignFilter,
  CreatorProfile,
  LeaderboardEntry,
  NewCampaignInput,
  PlatformSplitEntry,
  Clip,
} from "@/lib/services/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DBRow = Record<string, any>;

function mapCampaign(row: DBRow): Campaign {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandInitial: row.brand_initial || row.brand_name?.charAt(0) || "",
    name: row.name,
    category: row.category,
    status: row.status,
    daysRemaining: row.days_remaining ?? 30,
    endsAt: row.ends_at,
    ratePer100kMinor: row.rate_per_100k_minor ?? 0,
    budgetMinor: row.budget_minor ?? 0,
    spentMinor: row.spent_minor ?? 0,
    maxPayoutMinor: row.max_payout_minor ?? 0,
    minViews: row.min_views ?? 0,
    platforms: row.platforms ?? [],
    creatorCount: row.creator_count ?? 0,
    description: row.description ?? "",
    longDescription: row.long_description ?? "",
    rulesSummary: row.rules_summary ?? "",
    contentRequirements: row.content_requirements ?? [],
    prohibitedContent: row.prohibited_content ?? [],
    creatorRequirements: row.creator_requirements ?? [],
    requiredHashtags: row.required_hashtags ?? [],
    requiredMentions: row.required_mentions ?? [],
    requiredPhrases: row.required_phrases ?? [],
    totalViews: row.total_views ?? 0,
    totalClips: row.total_clips ?? 0,
    engagementRate: Number(row.engagement_rate ?? 0),
    cpmMinor: row.cpm_minor ?? 0,
    exampleClips: row.example_clips ?? [],
    faqs: row.faqs ?? [],
    geoBreakdown: row.geo_breakdown ?? [],
    spendHistory: row.spend_history ?? [],
    performanceSeries: row.performance_series ?? [],
    createdAt: row.created_at,
    coverUrl: row.cover_url || undefined,
  };
}

function mapClip(row: DBRow): Clip {
  return {
    id: row.id,
    title: row.title || undefined,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    brandName: row.brand_name,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    creatorHandle: row.creator_handle,
    platform: row.platform,
    url: row.url,
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    shares: row.shares ?? 0,
    postedAt: row.posted_at ?? new Date().toISOString(),
    submittedAt: row.submitted_at ?? new Date().toISOString(),
    status: row.status,
    earnedMinor: row.earned_minor ?? 0,
    rejectionReason: row.rejection_reason || undefined,
  };
}

export class InsforgeBrandService implements BrandService {
  private getBrandId(): string {
    if (typeof window === "undefined") return "usr-brand-01";
    const raw = window.localStorage.getItem("clipmatrix.session");
    if (!raw) return "usr-brand-01";
    try {
      return JSON.parse(raw)?.id ?? "usr-brand-01";
    } catch {
      return "usr-brand-01";
    }
  }

  async getBrand(): Promise<BrandProfile> {
    const brandId = this.getBrandId();
    const { data } = await insforge.database
      .from("profiles")
      .select()
      .eq("id", brandId)
      .single();
    return {
      id: brandId,
      userId: brandId,
      name: data?.name ?? "Nova Media",
      industry: data?.industry ?? "Media",
      website: data?.website ?? "",
      description: data?.bio ?? "",
      verified: data?.verified ?? false,
    };
  }

  async getOverview(): Promise<BrandOverview> {
    const brand = await this.getBrand();
    const campaigns = await this.listBrandCampaigns();

    const { data: clipsData } = await insforge.database
      .from("clips")
      .select("id, views, platform, creator_id, status")
      .in("campaign_id", campaigns.map((c) => c.id));

    const clips = clipsData ?? [];
    const totalViews = clips.reduce((sum: number, c: DBRow) => sum + (c.views ?? 0), 0);
    const creators = new Set(clips.map((c: DBRow) => c.creator_id)).size;
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spentMinor, 0);

    const platformSplit: PlatformSplitEntry[] = [
      { platform: "tiktok", pct: 35 },
      { platform: "instagram", pct: 30 },
      { platform: "youtube", pct: 25 },
      { platform: "x", pct: 10 },
    ];

    const topCreators: LeaderboardEntry[] = [];
    const byCreator = new Map<string, { views: number; count: number }>();
    for (const c of clips) {
      const existing = byCreator.get(c.creator_id);
      if (existing) {
        existing.views += c.views ?? 0;
        existing.count += 1;
      } else {
        byCreator.set(c.creator_id, { views: c.views ?? 0, count: 1 });
      }
    }
    Array.from(byCreator.entries())
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 5)
      .forEach(([id, v], i) => {
        topCreators.push({
          rank: i + 1,
          creatorId: id,
          displayName: `Creator ${id.slice(0, 8)}`,
          handle: `@creator${id.slice(0, 4)}`,
          views: v.views,
          engagementRate: 0,
          clipsCount: v.count,
          earnedMinor: 0,
        });
      });

    return {
      brandName: brand.name,
      metrics: {
        activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
        totalSpendMinor: totalSpend,
        totalViews,
        creators,
        engagementRate: 0,
        avgCpmMinor: totalViews > 0 ? Math.round((totalSpend / totalViews) * 100000) : 0,
      },
      campaignPerformance: campaigns.map((c) => ({
        label: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
        value: c.spentMinor,
      })),
      recentSubmissions: clips.slice(0, 5).map(mapClip),
      platformSplit,
      topCreators,
    };
  }

  async listBrandCampaigns(): Promise<Campaign[]> {
    const brandId = this.getBrandId();
    const { data, error } = await insforge.database
      .from("campaigns")
      .select()
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCampaign);
  }

  async getCampaignDetail(id: string): Promise<Campaign | null> {
    const { data, error } = await insforge.database
      .from("campaigns")
      .select()
      .eq("id", id)
      .single();
    if (error) return null;
    return mapCampaign(data);
  }

  async listCreators(search?: string): Promise<CreatorProfile[]> {
    let query = insforge.database.from("profiles").select().eq("role", "creator");
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data } = await query.limit(20);
    return (data ?? []).map((r: DBRow) => ({
      id: r.id,
      userId: r.id,
      displayName: r.name ?? "Creator",
      handle: r.handle ? `@${r.handle}` : "@creator",
      totalViews: r.total_views ?? 0,
      followers: r.followers ?? 0,
      lifetimeEarningsMinor: r.lifetime_earnings_minor ?? 0,
      clipsCount: r.clips_count ?? 0,
      engagementRate: Number(r.engagement_rate ?? 0),
      joinedAt: r.created_at,
    }));
  }

  async launchCampaign(input: NewCampaignInput): Promise<Campaign> {
    const brandId = this.getBrandId();
    const brand = await this.getBrand();
    const ends = new Date();
    ends.setDate(ends.getDate() + input.durationDays);
    const { data, error } = await insforge.database
      .from("campaigns")
      .insert([{
        brand_id: brandId,
        brand_name: brand.name,
        brand_initial: brand.name.charAt(0),
        name: input.name.trim(),
        category: input.category,
        status: "ACTIVE",
        days_remaining: input.durationDays,
        ends_at: ends.toISOString(),
        rate_per_100k_minor: input.ratePer100kMinor,
        budget_minor: input.budgetMinor,
        spent_minor: 0,
        max_payout_minor: input.maxPayoutMinor,
        min_views: input.minViews,
        platforms: input.platforms,
        creator_count: 0,
        description: input.description.trim(),
        long_description: input.description.trim(),
        required_phrases: input.requiredPhrases,
        required_hashtags: input.requiredHashtags,
        required_mentions: input.requiredMentions,
        prohibited_content: input.forbiddenContent.split("\n").map((l) => l.trim()).filter(Boolean),
        cpm_minor: Math.max(20, Math.round(input.ratePer100kMinor / 90)),
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data);
  }
}
