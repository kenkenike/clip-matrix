import { insforge } from "@/lib/insforge";
import type {
  Campaign,
  CampaignFilter,
  CampaignRules,
  CampaignService,
  NewCampaignInput,
  UpdateCampaignInput,
} from "@/lib/services/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

type DBRow = Record<string, any>;

function mapCampaign(row: DBRow): Campaign {
  const rules = (typeof row.rules === "string" ? JSON.parse(row.rules || "{}") : row.rules) || {};
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
    longDescription: row.long_description ?? row.description ?? "",
    rulesSummary: row.rules_summary ?? "",
    contentRequirements: row.content_requirements ?? [],
    prohibitedContent: row.prohibited_content ?? [],
    creatorRequirements: row.creator_requirements ?? [],
    requiredHashtags: row.required_hashtags ?? rules.requiredHashtags ?? [],
    requiredMentions: row.required_mentions ?? rules.requiredMentions ?? [],
    requiredPhrases: row.required_phrases ?? rules.requiredPhrases ?? [],
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

function matchesFilter(c: Campaign, f: CampaignFilter): boolean {
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

export class InsforgeCampaignService implements CampaignService {
  async listCampaigns(filter?: CampaignFilter): Promise<Campaign[]> {
    const { data, error } = await insforge.database
      .from("campaigns")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const campaigns = (data ?? []).map(mapCampaign);
    const filtered = campaigns.filter((c) => matchesFilter(c, filter ?? {}));
    return sortCampaigns(filtered, filter?.sort);
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    const { data, error } = await insforge.database
      .from("campaigns")
      .select()
      .eq("id", id)
      .single();
    if (error) return null;
    return mapCampaign(data);
  }

  async getRules(campaignId: string): Promise<CampaignRules | null> {
    const { data, error } = await insforge.database
      .from("campaigns")
      .select("id, platforms, required_phrases, required_hashtags, required_mentions, min_views, prohibited_content, days_remaining")
      .eq("id", campaignId)
      .single();
    if (error || !data) return null;
    return {
      campaignId: data.id,
      allowedPlatforms: data.platforms ?? [],
      requiredPhrases: data.required_phrases ?? [],
      requiredHashtags: data.required_hashtags ?? [],
      requiredMentions: data.required_mentions ?? [],
      minCreatorFollowers: 1_000,
      minViews: data.min_views ?? 0,
      forbiddenContent: data.prohibited_content ?? [],
      submissionWindowDays: data.days_remaining ?? 30,
    };
  }

  async joinCampaign(campaignId: string): Promise<void> {
    const { data: existing, error: fetchErr } = await insforge.database
      .from("campaigns")
      .select("id, status, creator_count")
      .eq("id", campaignId)
      .single();
    if (fetchErr || !existing) throw new Error("Campaign not found");
    if (existing.status === "DRAFT") throw new Error("This campaign has not launched yet.");
    const { error } = await insforge.database
      .from("campaigns")
      .update({ creator_count: (existing.creator_count ?? 0) + 1 })
      .eq("id", campaignId);
    if (error) throw new Error(error.message);
  }

  async createCampaign(input: NewCampaignInput): Promise<Campaign> {
    if (!input.name.trim()) throw new Error("Give your campaign a name before launching.");
    const ends = new Date();
    ends.setDate(ends.getDate() + input.durationDays);
    const { data, error } = await insforge.database
      .from("campaigns")
      .insert([{
        brand_id: "usr-brand-01",
        brand_name: "Nova Media",
        brand_initial: "N",
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
        rules_summary: input.forbiddenContent.trim() || "Standard rules apply.",
        content_requirements: [],
        prohibited_content: input.forbiddenContent.split("\n").map((l) => l.trim()).filter(Boolean),
        creator_requirements: [`Creators need at least ${input.minCreatorFollowers.toLocaleString()} followers`],
        required_hashtags: input.requiredHashtags,
        required_mentions: input.requiredMentions,
        required_phrases: input.requiredPhrases,
        cpm_modifier: Math.max(20, Math.round(input.ratePer100kMinor / 90)),
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data);
  }

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const update: Record<string, any> = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.category !== undefined) update.category = input.category;
    if (input.description !== undefined) {
      update.description = input.description.trim();
      update.long_description = input.description.trim();
    }
    if (input.longDescription !== undefined) update.long_description = input.longDescription;
    if (input.platforms !== undefined) update.platforms = input.platforms;
    if (input.requiredPhrases !== undefined) update.required_phrases = input.requiredPhrases;
    if (input.requiredHashtags !== undefined) update.required_hashtags = input.requiredHashtags;
    if (input.requiredMentions !== undefined) update.required_mentions = input.requiredMentions;
    if (input.forbiddenContent !== undefined) {
      update.prohibited_content = input.forbiddenContent.split("\n").map((l) => l.trim()).filter(Boolean);
    }
    if (input.budgetMinor !== undefined) update.budget_minor = input.budgetMinor;
    if (input.ratePer100kMinor !== undefined) update.rate_per_100k_minor = input.ratePer100kMinor;
    if (input.maxPayoutMinor !== undefined) update.max_payout_minor = input.maxPayoutMinor;
    if (input.minViews !== undefined) update.min_views = input.minViews;
    if (input.coverUrl !== undefined) update.cover_url = input.coverUrl || "";
    if (input.status !== undefined) update.status = input.status;
    const { data, error } = await insforge.database
      .from("campaigns")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data);
  }

  async updateStatus(campaignId: string, status: Campaign["status"]): Promise<void> {
    const { error } = await insforge.database
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId);
    if (error) throw new Error(error.message);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await insforge.database
      .from("campaigns")
      .delete()
      .eq("id", campaignId);
    if (error) throw new Error(error.message);
  }

  async increaseBudget(campaignId: string, amountMinor: number): Promise<Campaign> {
    const { data: existing } = await insforge.database
      .from("campaigns")
      .select("budget_minor")
      .eq("id", campaignId)
      .single();
    const { data, error } = await insforge.database
      .from("campaigns")
      .update({ budget_minor: (existing?.budget_minor ?? 0) + amountMinor })
      .eq("id", campaignId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data);
  }
}
