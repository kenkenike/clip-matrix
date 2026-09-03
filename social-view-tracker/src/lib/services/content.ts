import { prisma } from "@/lib/db";
import type { Platform, TrackStatus } from "@prisma/client";
import { validateAnyUrl } from "@/lib/providers";
import { enqueueRaw } from "@/lib/queue";
import { getEffectivePlan } from "@/lib/auth";

export type SortKey =
  | "views"
  | "likes"
  | "comments"
  | "updatedAt"
  | "publishedAt"
  | "createdAt";

export type ListFilters = {
  platform?: Platform;
  status?: TrackStatus;
  kind?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: SortKey;
  dir?: "asc" | "desc";
  page: number;
  pageSize: number;
  skip?: number;
  take?: number;
};

export async function trackUrl(userId: string, rawUrl: string) {
  const validation = validateAnyUrl(rawUrl);
  if (!validation.valid) {
    return { ok: false as const, error: validation.error ?? "Invalid URL." };
  }
  const platform = validation.platform as Platform;
  const externalId = validation.externalId as string;
  const normalizedUrl = validation.normalizedUrl as string;
  const kind = validation.kind ?? "OTHER";

  const plan = await getEffectivePlan(userId);

  const existing = await prisma.content.findUnique({
    where: { userId_platform_externalId: { userId, platform, externalId } },
  });

  if (existing) {
    // Deduplicate: still surface it, and schedule a refresh when stale.
    const staleMs = plan.checkIntervalMinutes * 60 * 1000;
    const shouldRefresh =
      !existing.lastCheckedAt || Date.now() - existing.lastCheckedAt.getTime() >= staleMs;
    if (shouldRefresh && existing.status !== "PROCESSING") {
      const job = await prisma.jobRecord.create({
        data: { userId, contentId: existing.id, url: normalizedUrl, status: "queued" },
      });
      enqueueRaw({ jobRecordId: job.id, userId });
    }
    return { ok: true as const, content: existing, duplicate: true };
  }

  const total = await prisma.content.count({ where: { userId } });
  if (total >= plan.maxContent) {
    return {
      ok: false as const,
      error: `Tracked-content limit reached (${plan.maxContent}). Upgrade your plan to track more content.`,
      code: "LIMIT_REACHED",
    };
  }

  const content = await prisma.content.create({
    data: {
      userId,
      platform,
      externalId,
      url: normalizedUrl,
      kind: kind as never,
      status: "PROCESSING",
    },
  });
  const job = await prisma.jobRecord.create({
    data: { userId, contentId: content.id, url: normalizedUrl, status: "queued" },
  });

  const usedScraper = !process.env.REDIS_URL;
  if (usedScraper) {
    // Without Redis we must resolve promptly or requests pile up; run the
    // check inline via the fallback queue so the dashboard has real data.
    enqueueRaw({ jobRecordId: job.id, userId });
  } else {
    enqueueRaw({ jobRecordId: job.id, userId });
  }

  return { ok: true as const, content, duplicate: false };
}

export async function trackUrls(userId: string, urls: string[]) {
  const seen = new Set<string>();
  const okResults: Awaited<ReturnType<typeof trackUrl>>[] = [];
  const failed: Array<{ error: string; code?: string }> = [];
  for (const raw of urls) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    const result = await trackUrl(userId, trimmed);
    if (result.ok) {
      okResults.push(result);
    } else {
      failed.push({ error: result.error, code: result.code });
    }
  }
  return { created: okResults.length, failed, results: okResults };
}

export async function listContents(userId: string, filters: ListFilters) {
  const where: Record<string, unknown> = { userId };
  if (filters.platform) where.platform = filters.platform;
  if (filters.status) where.status = filters.status;
  if (filters.kind && filters.kind !== "ALL") where.kind = filters.kind;
  if (filters.from || filters.to) {
    where.publishedAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { caption: { contains: filters.search, mode: "insensitive" } },
      { accountName: { contains: filters.search, mode: "insensitive" } },
      { url: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, string> = {};
  const sort = filters.sort ?? "updatedAt";
  const dir = filters.dir ?? "desc";
  if (sort === "views") {
    orderBy.views = dir;
  } else if (sort === "likes") {
    orderBy.likes = dir;
  } else if (sort === "comments") {
    orderBy.comments = dir;
  } else if (sort === "publishedAt") {
    orderBy.publishedAt = dir;
  } else if (sort === "createdAt") {
    orderBy.createdAt = dir;
  } else {
    orderBy.updatedAt = dir;
  }

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy,
      skip: filters.skip ?? 0,
      take: filters.take ?? 20,
    }),
    prisma.content.count({ where }),
  ]);

  const withGrowth = await Promise.all(
    items.map((c) => attachGrowth(c)),
  );

  return { items: withGrowth, total, page: filters.page, pageSize: filters.pageSize ?? 20 };
}

export async function getContent(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, userId } });
  if (!content) return null;
  return attachGrowth(content);
}

export async function deleteContent(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, userId } });
  if (!content) return false;
  await prisma.$transaction([
    prisma.metricSnapshot.deleteMany({ where: { contentId } }),
    prisma.viewAlert.updateMany({ where: { contentId }, data: { contentId: null } }),
    prisma.jobRecord.deleteMany({ where: { contentId } }),
    prisma.content.delete({ where: { id: contentId } }),
  ]);
  return true;
}

export async function refreshContent(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, userId } });
  if (!content) return null;
  if (content.status === "PROCESSING") return content;
  const job = await prisma.jobRecord.create({
    data: { userId, contentId, url: content.url, status: "queued" },
  });
  await prisma.content.update({ where: { id: contentId }, data: { status: "PROCESSING" } });
  enqueueRaw({ jobRecordId: job.id, userId });
  return content;
}

export async function getContentHistory(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({ where: { id: contentId, userId } });
  if (!content) return null;
  const snapshots = await prisma.metricSnapshot.findMany({
    where: { contentId },
    orderBy: { capturedAt: "asc" },
  });
  return { content, snapshots };
}

type ContentWithGrowth = Awaited<ReturnType<typeof prisma.content.findUnique>> & {
  viewsGained: number | null;
  growthPct: number | null;
};

async function attachGrowth(
  content: NonNullable<Awaited<ReturnType<typeof prisma.content.findUnique>>>,
): Promise<ContentWithGrowth> {
  const latestTwo = await prisma.metricSnapshot.findMany({
    where: { contentId: content.id },
    orderBy: { capturedAt: "desc" },
    take: 2,
    select: { views: true, capturedAt: true },
  });
  const latest = latestTwo[0];
  const previous = latestTwo[1];
  let viewsGained: number | null = null;
  let growthPct: number | null = null;
  if (latest?.views !== null && latest?.views !== undefined && previous?.views != null) {
    viewsGained = Number(latest.views) - Number(previous.views);
    if (Number(previous.views) > 0) {
      growthPct = ((Number(latest.views) - Number(previous.views)) / Number(previous.views)) * 100;
    }
  }
  return { ...content, viewsGained, growthPct };
}

/** Re-checks every tracked content for a user (used by tests / scheduled runs). */
export async function checkAllForUser(userId: string) {
  const contents = await prisma.content.findMany({
    where: { userId, status: { not: "PROCESSING" } },
  });
  for (const content of contents) {
    const job = await prisma.jobRecord.create({
      data: { userId, contentId: content.id, url: content.url, status: "queued" },
    });
    enqueueRaw({ jobRecordId: job.id, userId });
  }
  return contents.length;
}