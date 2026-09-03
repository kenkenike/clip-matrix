import { NextRequest } from "next/server";
import { bign, getApiUserFromRequest, getPagination, json } from "@/lib/api";
import type { Platform, TrackStatus } from "@prisma/client";
import { listContents } from "@/lib/services/content";

const PLATFORMS: Platform[] = ["YOUTUBE", "INSTAGRAM", "TIKTOK", "X"];
const STATUSES: TrackStatus[] = [
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "UNAVAILABLE",
  "RATE_LIMITED",
];

export async function GET(request: NextRequest) {
  const { user, error } = await getApiUserFromRequest(request);
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const { page, skip, take } = getPagination(sp);
  const platform = sp.get("platform")?.toUpperCase() as Platform | null;
  const status = sp.get("status")?.toUpperCase() as TrackStatus | null;

  const result = await listContents(user.id, {
    platform: platform && PLATFORMS.includes(platform) ? platform : undefined,
    status: status && STATUSES.includes(status) ? status : undefined,
    kind: sp.get("kind") ?? undefined,
    search: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    sort: (sp.get("sort") as "views" | "likes" | "comments" | "updatedAt" | "publishedAt") ?? "updatedAt",
    dir: sp.get("dir") === "asc" ? "asc" : "desc",
    page,
    pageSize: take,
    skip,
    take,
  });

  return json({
    items: result.items.map((c) => ({
      id: c.id,
      platform: c.platform,
      kind: c.kind,
      url: c.url,
      title: c.title,
      caption: c.caption,
      accountName: c.accountName,
      thumbnailUrl: c.thumbnailUrl,
      publishedAt: c.publishedAt,
      status: c.status,
      source: c.source,
      lastError: c.lastError,
      lastCheckedAt: c.lastCheckedAt,
      views: bign(c.views),
      likes: bign(c.likes),
      comments: bign(c.comments),
      viewsGained: c.viewsGained,
      growthPct: c.growthPct,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    pagination: { page, pageSize: take, total: result.total, pages: Math.ceil(result.total / take) },
  });
}