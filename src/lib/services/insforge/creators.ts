import { insforge } from "@/lib/insforge";
import type {
  Clip,
  CreatorOverview,
  CreatorProfile,
  CreatorService,
  EarningsEntry,
  LeaderboardEntry,
  NotificationItem,
  SocialAccount,
  SocialAccountStatus,
  SocialPlatformName,
  SubmitClipInput,
} from "@/lib/services/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DBRow = Record<string, any>;

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

function mapEarning(row: DBRow): EarningsEntry {
  return {
    id: row.id,
    date: row.created_at,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    views: row.views ?? 0,
    amountMinor: row.amount_minor ?? 0,
    status: row.status === "completed" ? "Paid" : row.status === "processing" ? "Processing" : "Pending",
    method: row.method === "upi" ? "upi" : "bank",
  };
}

function mapNotification(row: DBRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    time: row.time ?? row.created_at,
    unread: row.unread ?? true,
  };
}

export class InsforgeCreatorService implements CreatorService {
  async getCurrentCreator(): Promise<CreatorProfile> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data, error } = await insforge.database
      .from("profiles")
      .select()
      .eq("id", userId)
      .single();
    if (error || !data) {
      return {
        id: userId,
        userId,
        displayName: "Alex Rivera",
        handle: "@alexcreates",
        totalViews: 0,
        followers: 0,
        lifetimeEarningsMinor: 0,
        clipsCount: 0,
        engagementRate: 0,
        joinedAt: new Date().toISOString(),
      };
    }
    return {
      id: data.id,
      userId: data.id,
      displayName: data.name || "Creator",
      handle: data.handle ? `@${data.handle}` : "@creator",
      totalViews: data.total_views ?? 0,
      followers: data.followers ?? 0,
      lifetimeEarningsMinor: data.lifetime_earnings_minor ?? 0,
      clipsCount: data.clips_count ?? 0,
      engagementRate: Number(data.engagement_rate ?? 0),
      joinedAt: data.created_at,
    };
  }

  async getOverview(): Promise<CreatorOverview> {
    const creator = await this.getCurrentCreator();
    const clips = await this.listMyClips();
    const earnings = await this.listEarnings();
    const activeCampaigns = new Set(clips.filter((c) => c.status !== "rejected").map((c) => c.campaignId)).size;

    return {
      displayName: creator.displayName,
      metrics: {
        totalViews: creator.totalViews,
        totalEarningsMinor: creator.lifetimeEarningsMinor,
        activeCampaigns,
        pendingEarningsMinor: earnings
          .filter((e) => e.status === "Pending")
          .reduce((sum, e) => sum + e.amountMinor, 0),
      },
      earningsSeries: {
        "7D": [],
        "30D": [],
        "90D": [],
        ALL: earnings.slice(0, 12).map((e) => ({
          label: new Date(e.date).toLocaleDateString("en-US", { month: "short" }),
          value: e.amountMinor,
        })),
      },
      recentClips: clips.slice(0, 5),
      recentEarnings: earnings.slice(0, 5),
    };
  }

  async getSocialAccounts(): Promise<SocialAccount[]> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data } = await insforge.database
      .from("social_accounts")
      .select()
      .eq("user_id", userId);
    return (data ?? []).map((r: DBRow) => ({
      id: r.id,
      platform: r.platform as SocialPlatformName,
      username: r.username || null,
      followers: r.followers ?? 0,
      connectedAt: r.connected_at || null,
      status: r.status as SocialAccountStatus,
    }));
  }

  async setAccountStatus(platform: SocialPlatformName, status: SocialAccountStatus): Promise<SocialAccount> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data: existing } = await insforge.database
      .from("social_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .single();

    if (existing) {
      const { data, error } = await insforge.database
        .from("social_accounts")
        .update({ status, connected_at: status === "verified" ? new Date().toISOString() : null })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        platform: data.platform,
        username: data.username || null,
        followers: data.followers ?? 0,
        connectedAt: data.connected_at || null,
        status: data.status,
      };
    }

    const { data, error } = await insforge.database
      .from("social_accounts")
      .insert([{
        user_id: userId,
        platform,
        username: "",
        followers: 0,
        status,
        connected_at: status === "verified" ? new Date().toISOString() : null,
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      platform: data.platform,
      username: data.username || null,
      followers: data.followers ?? 0,
      connectedAt: data.connected_at || null,
      status: data.status,
    };
  }

  async getLeaderboard(campaignId: string): Promise<LeaderboardEntry[]> {
    const { data } = await insforge.database
      .from("clips")
      .select("creator_id, creator_name, creator_handle, views, likes, earned_minor")
      .eq("campaign_id", campaignId)
      .order("views", { ascending: false });
    if (!data) return [];

    const byCreator = new Map<string, { name: string; handle: string; views: number; earnedMinor: number; clipsCount: number }>();
    for (const r of data) {
      const existing = byCreator.get(r.creator_id);
      if (existing) {
        existing.views += r.views ?? 0;
        existing.earnedMinor += r.earned_minor ?? 0;
        existing.clipsCount += 1;
      } else {
        byCreator.set(r.creator_id, {
          name: r.creator_name,
          handle: r.creator_handle,
          views: r.views ?? 0,
          earnedMinor: r.earned_minor ?? 0,
          clipsCount: 1,
        });
      }
    }
    return Array.from(byCreator.entries())
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 20)
      .map(([creatorId, v], i) => ({
        rank: i + 1,
        creatorId,
        displayName: v.name,
        handle: v.handle,
        views: v.views,
        engagementRate: 0,
        clipsCount: v.clipsCount,
        earnedMinor: v.earnedMinor,
      }));
  }

  async listMyClips(): Promise<Clip[]> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data, error } = await insforge.database
      .from("clips")
      .select()
      .eq("creator_id", userId)
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapClip);
  }

  async submitClip(input: SubmitClipInput): Promise<Clip> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";
    const userName = session?.name ?? "Creator";

    const { data: campaign } = await insforge.database
      .from("campaigns")
      .select("id, name, brand_name")
      .eq("id", input.campaignId)
      .single();

    const { data, error } = await insforge.database
      .from("clips")
      .insert([{
        campaign_id: input.campaignId,
        campaign_name: campaign?.name ?? "",
        brand_name: campaign?.brand_name ?? "",
        creator_id: userId,
        creator_name: userName,
        creator_handle: userName.toLowerCase().replace(/\s+/g, ""),
        platform: input.platform,
        url: input.url,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        status: "pending",
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapClip(data);
  }

  async getNotifications(): Promise<NotificationItem[]> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data } = await insforge.database
      .from("notifications")
      .select()
      .eq("user_id", userId)
      .order("time", { ascending: false })
      .limit(20);
    return (data ?? []).map(mapNotification);
  }

  private async listEarnings(): Promise<EarningsEntry[]> {
    const { data: sessionRaw } = typeof window !== "undefined"
      ? { data: window.localStorage.getItem("clipmatrix.session") }
      : { data: null };
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const userId = session?.id ?? "usr-creator-01";

    const { data } = await insforge.database
      .from("earnings")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapEarning);
  }
}
