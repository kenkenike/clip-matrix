import { prisma } from "@/lib/db";
import type { Platform, TrackStatus } from "@prisma/client";

export type ExportRow = {
  platform: string;
  kind: string;
  title: string;
  caption: string;
  account: string;
  url: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  publishedAt: string | null;
  viewsGained: number | null;
  growthPct: number | null;
  status: string;
  lastCheckedAt: string | null;
};

export type ExportFilters = {
  platform?: Platform;
  status?: TrackStatus;
  from?: string;
  to?: string;
};

export async function buildExportRows(
  userId: string,
  filters: ExportFilters = {},
): Promise<ExportRow[]> {
  const where: Record<string, unknown> = { userId };
  if (filters.platform) where.platform = filters.platform;
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.publishedAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  const contents = await prisma.content.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const rows: ExportRow[] = [];
  for (const c of contents) {
    const latestTwo = await prisma.metricSnapshot.findMany({
      where: { contentId: c.id },
      orderBy: { capturedAt: "desc" },
      take: 2,
      select: { views: true },
    });
    const [latest, previous] = latestTwo;
    let viewsGained: number | null = null;
    let growthPct: number | null = null;
    if (latest?.views != null && previous?.views != null) {
      viewsGained = Number(latest.views) - Number(previous.views);
      if (Number(previous.views) > 0) {
        growthPct = ((Number(latest.views) - Number(previous.views)) / Number(previous.views)) * 100;
      }
    }
    rows.push({
      platform: c.platform,
      kind: c.kind,
      title: c.title ?? "",
      caption: c.caption ?? "",
      account: c.accountName ?? "",
      url: c.url,
      views: c.views === null ? null : Number(c.views),
      likes: c.likes === null ? null : Number(c.likes),
      comments: c.comments === null ? null : Number(c.comments),
      publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
      viewsGained,
      growthPct: growthPct === null ? null : Math.round(growthPct * 100) / 100,
      status: c.status,
      lastCheckedAt: c.lastCheckedAt ? c.lastCheckedAt.toISOString() : null,
    });
  }
  return rows;
}

export function rowsToCsv(rows: ExportRow[]): string {
  const header = [
    "platform",
    "kind",
    "title",
    "caption",
    "account",
    "url",
    "views",
    "likes",
    "comments",
    "publishedAt",
    "viewsGained",
    "growthPct",
    "status",
    "lastCheckedAt",
  ];
  const escape = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((h) => escape(row[h as keyof ExportRow])).join(","));
  }
  return lines.join("\n");
}

export function rowsToJson(rows: ExportRow[]): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), data: rows }, null, 2);
}