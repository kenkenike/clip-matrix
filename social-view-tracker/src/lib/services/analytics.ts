import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/format";

export type Overview = {
  totalContent: number;
  totalViews: number;
  averageViews: number;
  viewsGainedToday: number;
  totalLikes: number;
  totalComments: number;
  highestViewed: {
    id: string;
    title: string;
    url: string;
    platform: string;
    views: number;
    thumbnailUrl: string | null;
  } | null;
  fastestGrowing: {
    id: string;
    title: string;
    url: string;
    platform: string;
    views: number;
    growthPct: number;
    thumbnailUrl: string | null;
  } | null;
  statusBreakdown: Record<string, number>;
};

export async function getOverview(userId: string): Promise<Overview> {
  const contents = await prisma.content.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      url: true,
      platform: true,
      views: true,
      likes: true,
      comments: true,
      thumbnailUrl: true,
      status: true,
      // latest two snapshots for growth
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 2,
        select: { views: true, capturedAt: true },
      },
    },
  });

  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let viewsGainedToday = 0;
  const statusBreakdown: Record<string, number> = {};

  const grown: Array<{
    id: string;
    title: string;
    url: string;
    platform: string;
    views: number;
    growthPct: number;
    thumbnailUrl: string | null;
  }> = [];
  let highest: Overview["highestViewed"] = null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const c of contents) {
    const views = c.views === null || c.views === undefined ? 0 : Number(c.views);
    totalViews += views;
    totalLikes += c.likes === null || c.likes === undefined ? 0 : Number(c.likes);
    totalComments += c.comments === null || c.comments === undefined ? 0 : Number(c.comments);
    statusBreakdown[c.status] = (statusBreakdown[c.status] ?? 0) + 1;

    if (!highest || views > highest.views) {
      highest = {
        id: c.id,
        title: c.title ?? "Untitled",
        url: c.url,
        platform: c.platform,
        views,
        thumbnailUrl: c.thumbnailUrl,
      };
    }

    const [latest, previous] = c.snapshots;
    if (latest && previous && latest.views != null && previous.views != null) {
      const gained = Number(latest.views) - Number(previous.views);
      if (latest.capturedAt >= todayStart) viewsGainedToday += gained;
      if (Number(previous.views) > 0) {
        const growth = (Number(latest.views) - Number(previous.views)) / Number(previous.views) * 100;
        grown.push({
          id: c.id,
          title: c.title ?? "Untitled",
          url: c.url,
          platform: c.platform,
          views: Number(latest.views),
          growthPct: growth,
          thumbnailUrl: c.thumbnailUrl,
        });
      }
    }
  }

  grown.sort((a, b) => b.growthPct - a.growthPct);

  return {
    totalContent: contents.length,
    totalViews,
    averageViews: contents.length > 0 ? totalViews / contents.length : 0,
    viewsGainedToday,
    totalLikes,
    totalComments,
    highestViewed: contents.length > 0 ? highest : null,
    fastestGrowing: grown[0] ?? null,
    statusBreakdown,
  };
}

export type TimeRange = {
  from: Date;
  to: Date;
  granularity: "daily" | "weekly";
};

export type SeriesPoint = {
  date: string;
  views: number;
  likes: number;
  comments: number;
};

/**
 * Builds a combined engagement time series from metric snapshots, aggregated
 * per calendar day or per ISO week. Only counts content the user owns.
 */
export async function getProjectionSeries(
  userId: string,
  opts: TimeRange,
): Promise<SeriesPoint[]> {
  const snapshots = await prisma.metricSnapshot.findMany({
    where: { userId, capturedAt: { gte: new Date(opts.from), lte: new Date(opts.to) } },
    orderBy: { capturedAt: "asc" },
    select: { capturedAt: true, views: true, likes: true, comments: true },
  });

  const byKey = new Map<string, SeriesPoint>();

  for (const s of snapshots) {
    const key =
      opts.granularity === "weekly"
        ? isoWeekKey(s.capturedAt)
        : toDateKey(s.capturedAt);
    const existing = byKey.get(key);
    const views = s.views === null || s.views === undefined ? 0 : Number(s.views);
    const likes = s.likes === null || s.likes === undefined ? 0 : Number(s.likes);
    const comments = s.comments === null || s.comments === undefined ? 0 : Number(s.comments);
    if (existing) {
      existing.views = Math.max(existing.views, views);
      existing.likes = Math.max(existing.likes, likes);
      existing.comments = Math.max(existing.comments, comments);
    } else {
      byKey.set(key, { date: key, views, likes, comments });
    }
  }

  const points = Array.from(byKey.values()).sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

/** Daily gains between consecutive series points (views gained per period). */
export function dailyGrowth(points: SeriesPoint[]): SeriesPoint[] {
  return points.map((p, i) => {
    if (i === 0) return p;
    const prev = points[i - 1];
    return {
      date: p.date,
      views: Math.max(0, p.views - prev.views),
      likes: Math.max(0, p.likes - prev.likes),
      comments: Math.max(0, p.comments - prev.comments),
    };
  });
}

export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}