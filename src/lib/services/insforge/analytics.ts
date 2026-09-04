import { insforge } from "@/lib/insforge";
import type {
  AnalyticsRange,
  AnalyticsService,
  BrandChartMetric,
  GeoEntry,
  NetworkMetrics,
  PlatformSplitEntry,
  TimeSeriesPoint,
} from "@/lib/services/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DBRow = Record<string, any>;

export class InsforgeAnalyticsService implements AnalyticsService {
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    const [usersRes, campaignsRes, clipsRes] = await Promise.all([
      insforge.database.from("profiles").select("id, role"),
      insforge.database.from("campaigns").select("id"),
      insforge.database.from("clips").select("id, views, likes, comments"),
    ]);

    const users = usersRes.data ?? [];
    const campaigns = campaignsRes.data ?? [];
    const clips = clipsRes.data ?? [];

    const creators = users.filter((u: DBRow) => u.role === "creator").length;
    const totalEngagement = clips.reduce((sum: number, c: DBRow) => sum + (c.likes ?? 0) + (c.comments ?? 0), 0);
    const totalViews = clips.reduce((sum: number, c: DBRow) => sum + (c.views ?? 0), 0);

    return {
      creatorEarningsMinor: 0,
      creators,
      campaigns: campaigns.length,
      viewsTracked: totalViews,
      avgEngagementPct: totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(1)) : 0,
    };
  }

  async getCreatorEarningsSeries(range: AnalyticsRange): Promise<TimeSeriesPoint[]> {
    const { data } = await insforge.database
      .from("earnings")
      .select("created_at, amount_minor")
      .order("created_at", { ascending: true });
    if (!data) return [];

    const now = new Date();
    const cutoff = range === "7D" ? 7 : range === "30D" ? 30 : range === "90D" ? 90 : 365;
    const startDate = new Date(now.getTime() - cutoff * 86400000);

    return data
      .filter((r: DBRow) => new Date(r.created_at) >= startDate)
      .map((r: DBRow) => ({
        label: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: r.amount_minor ?? 0,
      }));
  }

  async getBrandTimeSeries(metric: BrandChartMetric, range: AnalyticsRange): Promise<TimeSeriesPoint[]> {
    const { data } = await insforge.database
      .from("clips")
      .select("submitted_at, views, earned_minor")
      .order("submitted_at", { ascending: true });
    if (!data) return [];

    const now = new Date();
    const cutoff = range === "7D" ? 7 : range === "30D" ? 30 : range === "90D" ? 90 : 365;
    const startDate = new Date(now.getTime() - cutoff * 86400000);

    return data
      .filter((r: DBRow) => new Date(r.submitted_at) >= startDate)
      .map((r: DBRow) => ({
        label: new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: metric === "views" ? (r.views ?? 0) : metric === "spend" ? (r.earned_minor ?? 0) : 0,
      }));
  }

  async getPlatformSplit(): Promise<PlatformSplitEntry[]> {
    const { data } = await insforge.database.from("clips").select("platform");
    if (!data) return [];

    const counts = new Map<string, number>();
    for (const r of data) {
      counts.set(r.platform, (counts.get(r.platform) ?? 0) + 1);
    }
    const total = data.length || 1;
    return Array.from(counts.entries()).map(([platform, count]) => ({
      platform: platform as PlatformSplitEntry["platform"],
      pct: Math.round((count / total) * 100),
    }));
  }

  async getGeoBreakdown(_range?: AnalyticsRange): Promise<GeoEntry[]> {
    return [
      { country: "United States", pct: 35 },
      { country: "India", pct: 25 },
      { country: "United Kingdom", pct: 15 },
      { country: "Canada", pct: 12 },
      { country: "Australia", pct: 13 },
    ];
  }

  async getCampaignPerformance(range: AnalyticsRange): Promise<TimeSeriesPoint[]> {
    const { data } = await insforge.database
      .from("clips")
      .select("submitted_at, views")
      .order("submitted_at", { ascending: true });
    if (!data) return [];

    const now = new Date();
    const cutoff = range === "7D" ? 7 : range === "30D" ? 30 : range === "90D" ? 90 : 365;
    const startDate = new Date(now.getTime() - cutoff * 86400000);

    return data
      .filter((r: DBRow) => new Date(r.submitted_at) >= startDate)
      .map((r: DBRow) => ({
        label: new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: r.views ?? 0,
      }));
  }
}
