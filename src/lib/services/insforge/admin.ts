import { insforge } from "@/lib/insforge";
import type {
  AdminOverview,
  AdminPayout,
  AdminService,
  AdminUserRow,
  Campaign,
  Clip,
  ClipStatus,
  ModerationReview,
  NewCampaignInput,
  SubmissionFilter,
  TimeSeriesPoint,
  Transaction,
  UpdateCampaignInput,
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
    fraudScore: row.fraud_score ?? undefined,
  };
}

function mapUser(row: DBRow): AdminUserRow {
  return {
    id: row.id,
    name: row.name ?? "User",
    handle: row.handle ?? "",
    role: (row.role ?? "creator") as AdminUserRow["role"],
    email: "", // emails are in auth.users, not exposed via profiles
    status: (row.status ?? "active") as AdminUserRow["status"],
    joinedAt: row.created_at,
    lifetimeValueMinor: row.lifetime_earnings_minor ?? 0,
  };
}

function mapTransaction(row: DBRow): Transaction {
  return {
    id: row.id,
    date: row.created_at,
    description: row.description,
    kind: row.kind === "withdrawal" ? "payout" : row.kind === "bonus" ? "adjustment" : "earning",
    amountMinor: row.amount_minor,
    status: row.status as Transaction["status"],
    method: row.method === "upi" ? "upi" : "bank",
    reference: row.reference ?? "",
  };
}

function mapPayout(row: DBRow): AdminPayout {
  return {
    id: row.id,
    creatorName: row.user_id?.slice(0, 8) ?? "User",
    method: row.method === "upi" ? "upi" : "bank",
    paymentDetail: row.payment_detail ?? "",
    amountMinor: row.amount_minor,
    requestedAt: row.requested_at ?? row.created_at,
    status: row.status as AdminPayout["status"],
  };
}

export class InsforgeAdminService implements AdminService {
  async getOverview(): Promise<AdminOverview> {
    const [usersRes, campaignsRes, clipsRes, payoutsRes] = await Promise.all([
      insforge.database.from("profiles").select("id, role", { count: "exact" }),
      insforge.database.from("campaigns").select("id, status, spent_minor"),
      insforge.database.from("clips").select("id, views, status, earned_minor"),
      insforge.database.from("payout_requests").select("id, amount_minor, status"),
    ]);

    const users = usersRes.data ?? [];
    const campaigns = campaignsRes.data ?? [];
    const clips = clipsRes.data ?? [];
    const payouts = payoutsRes.data ?? [];

    const totalUsers = users.length;
    const activeCreators = users.filter((u: DBRow) => u.role === "creator").length;
    const brands = users.filter((u: DBRow) => u.role === "brand").length;
    const activeCampaigns = campaigns.filter((c: DBRow) => c.status === "ACTIVE").length;
    const viewsTracked = clips.reduce((sum: number, c: DBRow) => sum + (c.views ?? 0), 0);
    const gmvMinor = clips.reduce((sum: number, c: DBRow) => sum + (c.earned_minor ?? 0), 0);
    const platformRevenueMinor = Math.round(gmvMinor * 0.1);
    const pendingPayoutsMinor = payouts
      .filter((p: DBRow) => p.status === "pending")
      .reduce((sum: number, p: DBRow) => sum + (p.amount_minor ?? 0), 0);
    const flaggedSubmissions = clips.filter((c: DBRow) => c.status === "flagged").length;

    return {
      totalUsers,
      activeCreators,
      brands,
      activeCampaigns,
      viewsTracked,
      gmvMinor,
      platformRevenueMinor,
      pendingPayoutsMinor,
      flaggedSubmissions,
    };
  }

  async getGmvSeries(): Promise<TimeSeriesPoint[]> {
    const { data } = await insforge.database
      .from("clips")
      .select("submitted_at, earned_minor")
      .order("submitted_at", { ascending: true });
    if (!data) return [];
    const byMonth = new Map<string, number>();
    for (const r of data) {
      const month = new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      byMonth.set(month, (byMonth.get(month) ?? 0) + (r.earned_minor ?? 0));
    }
    return Array.from(byMonth.entries()).map(([label, value]) => ({ label, value }));
  }

  async listSubmissions(filter?: SubmissionFilter): Promise<Clip[]> {
    let query = insforge.database.from("clips").select();
    if (filter?.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }
    if (filter?.campaignId) {
      query = query.eq("campaign_id", filter.campaignId);
    }
    if (filter?.search) {
      query = query.ilike("creator_name", `%${filter.search}%`);
    }
    const { data, error } = await query.order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapClip);
  }

  async reviewSubmission(
    clipId: string,
    action: ModerationReview["action"],
    notes: string,
    rejectionReason?: string
  ): Promise<void> {
    const statusMap: Record<string, ClipStatus> = {
      approve: "approved",
      reject: "rejected",
      flag: "flagged",
      unflag: "pending",
    };
    const newStatus = statusMap[action] ?? "pending";

    const { error } = await insforge.database
      .from("clips")
      .update({
        status: newStatus,
        rejection_reason: rejectionReason ?? "",
      })
      .eq("id", clipId);
    if (error) throw new Error(error.message);

    await insforge.database.from("moderation_reviews").insert([{
      clip_id: clipId,
      reviewer_id: "usr-admin-01",
      action,
      notes,
      rejection_reason: rejectionReason ?? "",
    }]);
  }

  async listFraudQueue(): Promise<Clip[]> {
    const { data, error } = await insforge.database
      .from("clips")
      .select()
      .in("status", ["flagged", "under_review"])
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapClip);
  }

  async updateFraudNote(clipId: string, note: string): Promise<void> {
    const { error } = await insforge.database
      .from("fraud_flags")
      .update({ note })
      .eq("clip_id", clipId);
    if (error) throw new Error(error.message);
  }

  async listUsers(search?: string): Promise<AdminUserRow[]> {
    let query = insforge.database.from("profiles").select();
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapUser);
  }

  async listRecentSignups(limit?: number): Promise<AdminUserRow[]> {
    const { data, error } = await insforge.database
      .from("profiles")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapUser);
  }

  async getUser(id: string): Promise<AdminUserRow> {
    const { data, error } = await insforge.database
      .from("profiles")
      .select()
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return mapUser(data);
  }

  async getUserCampaigns(id: string): Promise<string[]> {
    const { data } = await insforge.database
      .from("campaigns")
      .select("name")
      .eq("brand_id", id);
    return (data ?? []).map((r: DBRow) => r.name);
  }

  async banUser(id: string): Promise<void> {
    const { error } = await insforge.database
      .from("profiles")
      .update({ status: "banned" })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async kickUser(id: string): Promise<void> {
    const { error } = await insforge.database
      .from("profiles")
      .update({ status: "kicked" })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listPayments(): Promise<Transaction[]> {
    const { data, error } = await insforge.database
      .from("transactions")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransaction);
  }

  async listPayouts(): Promise<AdminPayout[]> {
    const { data, error } = await insforge.database
      .from("payout_requests")
      .select()
      .order("requested_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPayout);
  }

  async releasePayout(id: string): Promise<void> {
    const { error } = await insforge.database
      .from("payout_requests")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listCampaigns(search?: string): Promise<Campaign[]> {
    let query = insforge.database.from("campaigns").select();
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCampaign);
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

  async createCampaign(input: NewCampaignInput): Promise<Campaign> {
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
        max_payout_minor: input.maxPayoutMinor,
        min_views: input.minViews,
        platforms: input.platforms,
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

  async updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
    const update: Record<string, any> = {};
    if (input.name !== undefined) update.name = input.name.trim();
    if (input.category !== undefined) update.category = input.category;
    if (input.description !== undefined) update.description = input.description.trim();
    if (input.status !== undefined) update.status = input.status;
    if (input.budgetMinor !== undefined) update.budget_minor = input.budgetMinor;
    if (input.ratePer100kMinor !== undefined) update.rate_per_100k_minor = input.ratePer100kMinor;
    const { data, error } = await insforge.database
      .from("campaigns")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await insforge.database
      .from("campaigns")
      .delete()
      .eq("id", campaignId);
    if (error) throw new Error(error.message);
  }

  async updateCampaignStatus(campaignId: string, status: Campaign["status"]): Promise<void> {
    const { error } = await insforge.database
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId);
    if (error) throw new Error(error.message);
  }
}
