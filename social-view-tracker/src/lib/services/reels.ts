/**
 * Instagram Reels service — the orchestration layer between the API, the
 * Instagram Graph API provider, and PostgreSQL. Implements the tracking
 * algorithm:
 *
 *   Validate URL → extract shortcode → duplicate check → create Reel
 *   → (connection) resolve media id → fetch official metrics
 *   → store initial views → scheduled refresh → fetch latest views
 *   → save history → update current views → calculate views gained.
 *
 * Metrics flow exclusively through an authorized OAuth connection
 * (InstagramConnection). The public Instagram page is never fetched; when the
 * authorized API does not expose a view count, the system records an honest
 * metric_unavailable state instead of fabricating a number.
 *
 * Statuses:
 *   pending_connection         no usable OAuth connection yet
 *   pending_media_resolution   shortcode could not be turned into a media id
 *   active                     official views are being recorded
 *   paused                     user paused this reel
 *   metric_unavailable         API reached but offers no view metric
 *   failed                     transient/permission/oauth errors (retried w/ backoff)
 *   deleted                    Instagram says the media is gone
 *   completed                  terminal state kept for listings
 */
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { extractInstagramReelId, normalizeReelUrl } from "@/lib/reels/extract";
import {
  analyzeDelta,
  classifyMetricsCall,
  computeViewsGained,
  isTransientClassification,
  growthPercent,
  type MetricsCallLike,
  type ReelTrackingStatus,
} from "@/lib/reels/domain";
import { logReelEvent } from "@/lib/services/reel-log";
import { findConnectionWithToken } from "@/lib/services/instagram-connections";
import {
  InstagramGraphProvider,
  resolveMediaId,
  type InstagramMetricsCall,
  type MediaResolutionResult,
} from "@/lib/instagram/InstagramMetricsProvider";

export const MAX_ERRORS_BEFORE_FAIL = clampNumber(
  process.env.REEL_MAX_ERRORS_BEFORE_FAIL,
  8,
);

function clampNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const reelFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z
    .enum([
      "all",
      "active",
      "paused",
      "failed",
      "deleted",
      "completed",
      "metric_unavailable",
      "pending_connection",
      "pending_media_resolution",
    ])
    .optional(),
  sort: z.enum(["recent", "views", "growth", "oldest"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type ReelStatusFilter = NonNullable<z.infer<typeof reelFiltersSchema>["status"]>;

export type AddReelResult =
  | {
      ok: true;
      reel: { id: string; instagramReelId: string; trackingStatus: string; currentViews: number };
      duplicate: false;
      /** Additional status hint: connection_required | metric_unavailable | … */
      status?: string;
      message: string;
    }
  | { ok: false; duplicate: boolean; code: string; error: string };

type ReelRow = {
  id: string;
  instagramReelId: string;
  instagramUrl: string;
  normalizedUrl: string;
  username: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  currentViews: number;
  initialViews: number | null;
  viewsGained: number;
  trackingStatus: string;
  lastCheckedAt: Date | null;
  lastError: string | null;
  lastSource: string | null;
  flaggedForReview: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Reel building blocks
// ---------------------------------------------------------------------------

/**
 * Normalizes the outcome of a resolution + metrics fetch into the pure
 * classifier input. The provider never fabricates views: when no value came
 * back, `data.views` stays undefined.
 */
function providerOutputToCallLike(
  output: InstagramMetricsCall | MediaResolutionResult,
): MetricsCallLike {
  if (output.ok) {
    if ("data" in output && output.data) {
      return { ok: true, data: { views: output.data.views } };
    }
    return { ok: false, category: "media_resolution", errorMessage: "Media could not be verified." };
  }
  return { ok: false, category: output.category, errorMessage: output.errorMessage };
}

/**
 * Runs the full authorized pipeline for a reel:
 *   connection token → resolve shortcode to media id → fetch metrics.
 * Returns the raw provider output (never synthesized) plus what it was.
 */
async function fetchOfficialMetrics(
  userId: string,
  shortcode: string,
  connectionId: string | null | undefined,
  resolvedMediaId: string | null,
): Promise<{
  output: InstagramMetricsCall | MediaResolutionResult | null;
  mediaId: string | null;
  connectionId: string | null;
}> {
  const bound = await findConnectionWithToken(userId, connectionId);
  if (!bound) {
    return { output: null, mediaId: null, connectionId: null };
  }
  let mediaId = resolvedMediaId;
  if (mediaId === null) {
    const resolved = await resolveMediaId(shortcode, bound.accessToken);
    if (resolved.ok) {
      mediaId = resolved.mediaId;
    } else {
      return { output: resolved, mediaId: null, connectionId: bound.connection.id };
    }
  }
  const output = await new InstagramGraphProvider().getMediaMetrics(mediaId, bound.accessToken);
  return { output, mediaId, connectionId: bound.connection.id };
}

/**
 * Flags reels whose latest snapshot has suspiciously identical metadata to
 * another active reel (possible duplicated/manipulated data) — admin review
 * only, never auto-actioned.
 */
async function flagIdenticalMetadata(
  userId: string,
  reelId: string,
  views: number,
  caption: string | null,
  thumbnailUrl: string | null,
): Promise<boolean> {
  if (!caption && !thumbnailUrl) return false;
  const twins = await prisma.reel.count({
    where: {
      userId,
      trackingStatus: "active",
      NOT: { id: reelId },
      currentViews: views,
      ...(caption ? { caption } : {}),
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    },
  });
  if (twins > 0) {
    await logReelEvent(
      userId,
      reelId,
      "flag",
      `${twins} other tracked reel(s) share identical metadata and the same view count (${views.toLocaleString()}). Flagged for admin review.`,
      { twins },
    );
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

/**
 * Adds a reel to tracking. Validates the URL, extracts the shortcode, rejects
 * duplicates, creates the record, then runs the authorized metric pipeline.
 * Without a connected account the reel is still created as
 * `pending_connection` and the response says exactly that.
 */
export async function addReel(userId: string, rawUrl: string): Promise<AddReelResult> {
  const url = (rawUrl ?? "").trim();
  const extracted = extractInstagramReelId(url);
  if (extracted.ok === false) {
    const code =
      extracted.error === "NOT_INSTAGRAM"
        ? "INVALID_INSTAGRAM_URL"
        : extracted.error === "NOT_REEL"
          ? "NOT_A_REEL"
          : "INVALID_INSTAGRAM_URL";
    return { ok: false, duplicate: false, code, error: "Invalid Instagram Reel URL." };
  }

  const normalizedUrl = normalizeReelUrl(extracted.reelId);

  const existing = await prisma.reel.findUnique({
    where: { userId_instagramReelId: { userId, instagramReelId: extracted.reelId } },
  });
  if (existing) {
    return {
      ok: false,
      duplicate: true,
      code: "DUPLICATE_REEL",
      error: "This reel is already being tracked.",
    };
  }

  const now = new Date();
  const bound = await findConnectionWithToken(userId);

  if (!bound) {
    const created = await prisma.reel.create({
      data: {
        userId,
        instagramReelId: extracted.reelId,
        instagramUrl: url,
        normalizedUrl,
        currentViews: 0,
        initialViews: null,
        viewsGained: 0,
        trackingStatus: "pending_connection",
        lastCheckedAt: now,
        lastSource: null,
      },
    });
    await logReelEvent(
      userId,
      created.id,
      "created",
      `Reel ${extracted.reelId} added to tracking. Awaiting an Instagram account connection to enable metric tracking.`,
      { instagramUrl: url },
    );
    return {
      ok: true,
      duplicate: false,
      reel: {
        id: created.id,
        instagramReelId: created.instagramReelId,
        trackingStatus: created.trackingStatus,
        currentViews: created.currentViews,
      },
      status: "connection_required",
      message: "Connect the Instagram account to enable metric tracking.",
    };
  }

  // Resolve the shortcode against the authorized account, then fetch metrics.
  let output: InstagramMetricsCall | MediaResolutionResult;
  let mediaId: string | null = null;
  const resolved = await resolveMediaId(extracted.reelId, bound.accessToken);
  if (resolved.ok) {
    mediaId = resolved.mediaId;
    output = await new InstagramGraphProvider().getMediaMetrics(resolved.mediaId, bound.accessToken);
  } else {
    output = resolved;
  }

  const classified = classifyMetricsCall(providerOutputToCallLike(output));
  const views = classified.views;
  const media =
    output.ok && "data" in output && output.data ? output.data : null;

  const created = await prisma.reel.create({
    data: {
      userId,
      instagramReelId: extracted.reelId,
      instagramUrl: url,
      normalizedUrl,
      instagramMediaId: mediaId,
      connectedAccountId: bound.connection.id,
      username: media?.accountName ?? null,
      caption: media?.caption ?? null,
      thumbnailUrl: media?.thumbnailUrl ?? null,
      currentViews: views ?? 0,
      initialViews: views,
      viewsGained: 0,
      trackingStatus: classified.status,
      lastCheckedAt: now,
      lastError: classified.message ?? null,
      lastSource: views !== null ? "instagram_api" : null,
      consecutiveErrors: views === null && classified.status === "failed" ? 1 : 0,
    },
  });

  await logReelEvent(
    userId,
    created.id,
    "created",
    `Reel ${extracted.reelId} added to tracking.`,
    { instagramUrl: url },
  );

  if (views !== null) {
    await prisma.reelViewHistory.create({
      data: {
        reelId: created.id,
        viewCount: views,
        source: "instagram_api",
        previousViewCount: null,
        eventType: "normal",
        flagged: false,
      },
    });
    await logReelEvent(
      userId,
      created.id,
      "refresh",
      `Initial official view count recorded: ${views.toLocaleString()}.`,
      { views, source: "instagram_api" },
    );
  } else {
    if (classified.status === "metric_unavailable") {
      await prisma.reelViewHistory.create({
        data: {
          reelId: created.id,
          viewCount: null,
          source: null,
          previousViewCount: null,
          eventType: "missing_metrics",
          note: classified.message ?? "No view metric provided by the authorized API.",
        },
      });
    }
    await logReelEvent(
      userId,
      created.id,
      "error",
      classified.message ?? "No view count could be obtained.",
      { reason: classified.reason },
    );
  }

  return {
    ok: true,
    duplicate: false,
    reel: {
      id: created.id,
      instagramReelId: created.instagramReelId,
      trackingStatus: created.trackingStatus,
      currentViews: created.currentViews,
    },
    status: views === null ? classified.status : undefined,
    message:
      views !== null
        ? "Reel added successfully"
        : classified.message ?? "Reel added successfully",
  };
}

/**
 * Refreshes a reel through the authorized pipeline: fetch latest metrics,
 * insert a history row, update current views / views gained, and flag
 * corrections/suspicious jumps/repeated responses for admin review. Views
 * gained never goes negative; initialViews is never re-based once set.
 */
export async function refreshReel(
  userId: string,
  reelId: string,
  opts: { manual?: boolean } = {},
): Promise<{ ok: true; reel: ReelRow } | { ok: false; code: string; error: string }> {
  const reel = await prisma.reel.findUnique({ where: { id: reelId, userId } });
  if (!reel) return { ok: false, code: "NOT_FOUND", error: "Reel not found." };
  if (reel.trackingStatus === "paused") {
    return { ok: false, code: "PAUSED", error: "Reel is paused; resume it to refresh." };
  }
  if (reel.trackingStatus === "completed" || reel.trackingStatus === "deleted") {
    return { ok: false, code: "NOT_REFRESHABLE", error: "Tracking has ended for this reel." };
  }

  const previously = reel.currentViews > 0 ? reel.currentViews : null;
  const previousConsecutiveIdentical = reel.consecutiveIdentical;
  const now = new Date();

  const fetched = await fetchOfficialMetrics(
    userId,
    reel.instagramReelId,
    reel.connectedAccountId,
    reel.instagramMediaId,
  );

  // No usable connection (or it was disconnected since creation).
  if (!fetched.connectionId || !fetched.output) {
    await prisma.reel.update({
      where: { id: reel.id },
      data: {
        lastCheckedAt: now,
        lastError: "Connect the Instagram account to enable metric tracking.",
        connectedAccountId: null,
        trackingStatus: "pending_connection",
      },
    });
    await logReelEvent(userId, reel.id, "error", "Connect the Instagram account to enable metric tracking.", {
      reason: "connection_required",
    });
    const updated = await prisma.reel.findUniqueOrThrow({ where: { id: reel.id } });
    return { ok: true, reel: updated };
  }

  const output = fetched.output;
  const classified = classifyMetricsCall(providerOutputToCallLike(output));
  const views = classified.views;
  const media =
    output.ok && "data" in output && output.data ? output.data : null;

  if (views !== null) {
    const delta = analyzeDelta(previously, views, previousConsecutiveIdentical);
    const { gained, correction } = computeViewsGained(reel.initialViews, views);

    await prisma.reelViewHistory.create({
      data: {
        reelId: reel.id,
        viewCount: views,
        source: "instagram_api",
        previousViewCount: previously,
        eventType: delta.eventType,
        flagged: delta.flagged || correction,
        note:
          delta.note ??
          (correction ? "View count reduced since tracking began; recorded as a metric correction." : undefined),
      },
    });

    const flaggedMeta = await flagIdenticalMetadata(
      userId,
      reel.id,
      views,
      media?.caption ?? reel.caption,
      media?.thumbnailUrl ?? reel.thumbnailUrl,
    );

    await prisma.reel.update({
      where: { id: reel.id },
      data: {
        instagramMediaId: fetched.mediaId ?? reel.instagramMediaId,
        connectedAccountId: fetched.connectionId,
        currentViews: views,
        viewsGained: gained,
        username: media?.accountName ?? reel.username,
        caption: media?.caption ?? reel.caption,
        thumbnailUrl: media?.thumbnailUrl ?? reel.thumbnailUrl,
        lastCheckedAt: now,
        lastSource: "instagram_api",
        lastError: null,
        consecutiveErrors: 0,
        consecutiveIdentical: delta.consecutiveIdentical,
        trackingStatus: "active",
        flaggedForReview: delta.flagged || flaggedMeta,
      },
    });

    if (delta.flagged) {
      await logReelEvent(userId, reel.id, "flag", delta.note ?? "Unusual activity flagged for review.", {
        eventType: delta.eventType,
        views,
      });
    }
    await logReelEvent(
      userId,
      reel.id,
      "refresh",
      `Refreshed: ${(previously ?? 0).toLocaleString()} → ${views.toLocaleString()} official views.`,
      { manual: opts.manual ?? false, views, viewsGained: gained, source: "instagram_api" },
    );
  } else {
    const status = classified.status;

    // metric_unavailable is not an error — record an honest snapshot.
    if (status === "metric_unavailable") {
      await prisma.reelViewHistory.create({
        data: {
          reelId: reel.id,
          viewCount: null,
          source: null,
          previousViewCount: previously,
          eventType: "missing_metrics",
          note: classified.message ?? "No view metric provided by the authorized API.",
        },
      });
    }

    if (status === "pending_media_resolution") {
      await prisma.reel.update({
        where: { id: reel.id },
        data: {
          instagramMediaId: null,
          connectedAccountId: fetched.connectionId,
          lastCheckedAt: now,
          lastError: classified.message ?? "Shortcode could not be resolved to a media id.",
          lastSource: null,
          trackingStatus: status,
        },
      });
      await logReelEvent(userId, reel.id, "status_change", `Tracking status set to "${status}".`, {
        reason: classified.reason,
      });
      await logReelEvent(userId, reel.id, "error", classified.message ?? status, {
        reason: classified.reason,
      });
    } else if (status === "deleted") {
      await prisma.reel.update({
        where: { id: reel.id },
        data: {
          connectedAccountId: fetched.connectionId,
          lastCheckedAt: now,
          lastError: classified.message ?? "Media removed on Instagram.",
          lastSource: null,
          trackingStatus: status,
        },
      });
      await logReelEvent(userId, reel.id, "status_change", `Tracking status set to "${status}".`, {
        reason: classified.reason,
      });
    } else {
      // failed (transient, oauth, permission) — backoff, then fail after N.
      const consecutiveErrors = reel.consecutiveErrors + 1;
      const transient = isTransientClassification(classified);
      const shouldFail = consecutiveErrors >= MAX_ERRORS_BEFORE_FAIL;
      const nextStatus: ReelTrackingStatus = transient
        ? shouldFail
          ? "failed"
          : (reel.trackingStatus as ReelTrackingStatus) === "failed"
            ? "failed"
            : "active"
        : "failed";

      await prisma.reel.update({
        where: { id: reel.id },
        data: {
          connectedAccountId: fetched.connectionId,
          lastCheckedAt: now,
          lastError: classified.message ?? "Instagram API error.",
          consecutiveErrors,
          trackingStatus: nextStatus,
        },
      });
      if (nextStatus !== "active") {
        await logReelEvent(userId, reel.id, "status_change", `Tracking status set to "${nextStatus}".`, {
          reason: classified.reason,
        });
      }
      await logReelEvent(userId, reel.id, "error", classified.message ?? "Instagram API error.", {
        reason: classified.reason,
        consecutiveErrors,
      });
    }
  }

  const updated = await prisma.reel.findUniqueOrThrow({ where: { id: reel.id } });
  return { ok: true, reel: updated };
}

export async function changeTrackingStatus(
  userId: string,
  reelId: string,
  status: "paused" | "active",
): Promise<{ ok: true } | { ok: false; code: string; error: string }> {
  const reel = await prisma.reel.findUnique({ where: { id: reelId, userId } });
  if (!reel) return { ok: false, code: "NOT_FOUND", error: "Reel not found." };
  if (status === "active" && reel.trackingStatus !== "paused") {
    return { ok: false, code: "NOT_PAUSED", error: "Only paused reels can be resumed." };
  }
  await prisma.reel.update({
    where: { id: reel.id },
    data: { trackingStatus: status, lastError: null },
  });
  await logReelEvent(userId, reel.id, "status_change", status === "paused" ? "Tracking paused." : "Tracking resumed.");
  return { ok: true };
}

export async function deleteReel(
  userId: string,
  reelId: string,
): Promise<{ ok: true } | { ok: false; code: string; error: string }> {
  const reel = await prisma.reel.findUnique({ where: { id: reelId, userId } });
  if (!reel) return { ok: false, code: "NOT_FOUND", error: "Reel not found." };
  await prisma.reel.delete({ where: { id: reel.id } });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const SORT_ORDERS: Record<string, Record<string, "asc" | "desc">> = {
  recent: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  views: { currentViews: "desc" },
  growth: { viewsGained: "desc" },
};

export async function listReels(
  userId: string,
  filters: z.infer<typeof reelFiltersSchema>,
) {
  const { search, status, sort, page = 1, pageSize = 20 } = filters;
  const where: Record<string, unknown> = { userId };
  if (status && status !== "all") where.trackingStatus = status;
  if (search) {
    where.OR = [
      { instagramReelId: { contains: search } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.reel.findMany({
      where,
      orderBy: SORT_ORDERS[sort ?? "recent"] ?? SORT_ORDERS.recent,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reel.count({ where }),
  ]);

  return {
    reels: rows.map((r) => ({
      id: r.id,
      instagramReelId: r.instagramReelId,
      instagramUrl: r.instagramUrl,
      normalizedUrl: r.normalizedUrl,
      username: r.username,
      caption: r.caption,
      thumbnailUrl: r.thumbnailUrl,
      currentViews: r.currentViews,
      initialViews: r.initialViews,
      viewsGained: r.viewsGained,
      trackingStatus: r.trackingStatus,
      lastCheckedAt: r.lastCheckedAt,
      lastError: r.lastError,
      lastSource: r.lastSource,
      flaggedForReview: r.flaggedForReview,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

/** Views a reel gained since a window start (never negative). */
async function gainedSince(
  userId: string,
  since: Date,
  reels: Array<{ id: string; currentViews: number; initialViews: number | null }>,
): Promise<number> {
  const ids = reels.map((r) => r.id);
  if (ids.length === 0) return 0;

  const bases = await prisma.$queryRaw<
    Array<{ reelId: string; viewCount: number }>
  >`SELECT DISTINCT ON ("reelId") "reelId", "viewCount" FROM "ReelViewHistory"
       WHERE "reelId" IN (${Prisma.join(ids)}) AND "checkedAt" <= ${since} AND "viewCount" IS NOT NULL
       ORDER BY "reelId", "checkedAt" DESC`;

  const byId = new Map(bases.map((b) => [b.reelId, b.viewCount]));
  let total = 0;
  for (const reel of reels) {
    const base = byId.get(reel.id);
    if (base !== undefined) {
      total += Math.max(0, reel.currentViews - base);
    } else {
      // Tracked within the window: count growth since tracking began.
      total += Math.max(0, reel.currentViews - (reel.initialViews ?? 0));
    }
  }
  return total;
}

export async function reelStats(userId: string) {
  const [counts, reels] = await Promise.all([
    prisma.reel.groupBy({
      by: ["trackingStatus"],
      _count: { _all: true },
      where: { userId },
    }),
    prisma.reel.findMany({
      where: { userId },
      select: {
        id: true,
        currentViews: true,
        initialViews: true,
        trackingStatus: true,
        thumbnailUrl: true,
        username: true,
        instagramReelId: true,
        viewsGained: true,
      },
    }),
  ]);

  const authed = await getCurrentUser();

  const statusCount = Object.fromEntries(counts.map((c) => [c.trackingStatus, c._count._all]));
  const totalReels = reels.length;
  const totalViews = reels.reduce((sum, r) => sum + r.currentViews, 0);
  const withViews = reels.filter((r) => r.currentViews > 0);
  const active = reels.filter((r) => r.trackingStatus === "active");
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [today, week, month] = await Promise.all([
    gainedSince(userId, startOfDay, reels),
    gainedSince(userId, new Date(now.getTime() - WEEK_MS), reels),
    gainedSince(userId, new Date(now.getTime() - MONTH_MS), reels),
  ]);

  let top: (typeof reels)[number] | null = null;
  for (const r of active) {
    if (!top || r.currentViews > top.currentViews) top = r;
  }

  return {
    totalReels,
    totalViews,
    viewsGainedToday: today,
    viewsGainedThisWeek: week,
    viewsGainedThisMonth: month,
    averageViewsPerReel: withViews.length > 0 ? Math.round(totalViews / withViews.length) : 0,
    activeTracking: statusCount["active"] ?? 0,
    pausedTracking: statusCount["paused"] ?? 0,
    pendingConnections: statusCount["pending_connection"] ?? 0,
    failedInvalid:
      (statusCount["failed"] ?? 0) +
      (statusCount["deleted"] ?? 0) +
      (statusCount["pending_media_resolution"] ?? 0),
    isAdmin: authed?.role === "ADMIN",
    topPerformingReel: top
      ? {
          id: top.id,
          instagramReelId: top.instagramReelId,
          username: top.username,
          thumbnailUrl: top.thumbnailUrl,
          currentViews: top.currentViews,
          viewsGained: top.viewsGained,
        }
      : null,
  };
}

export async function reelDetail(userId: string, id: string) {
  const reel = await prisma.reel.findUnique({
    where: { id, userId },
    include: {
      history: {
        orderBy: { checkedAt: "asc" },
        select: { viewCount: true, checkedAt: true, source: true, eventType: true, flagged: true },
      },
    },
  });
  if (!reel) return null;

  const gained = computeViewsGained(reel.initialViews, reel.currentViews).gained;
  const growth = growthPercent(reel.initialViews, reel.currentViews);
  const history = reel.history;
  const firstCheckedAt = history.length > 0 ? history[0].checkedAt : reel.createdAt;
  const totalDurationMs = Math.max(0, Date.now() - firstCheckedAt.getTime());

  // Charts only use snapshots that actually carried a view count; unavailable
  // snapshots (viewCount null) are listed but never plotted.
  const numericPoints = history
    .filter((h) => h.viewCount !== null)
    .map((h) => ({ t: h.checkedAt, v: h.viewCount! }));

  // Gains per calendar day (and peak period).
  const perDay = new Map<string, number>();
  let peakDay: { date: string; gained: number } | null = null;
  for (let i = 0; i < numericPoints.length; i++) {
    const delta = i === 0 ? 0 : numericPoints[i].v - numericPoints[i - 1].v;
    if (delta <= 0) continue;
    const key = numericPoints[i].t.toISOString().slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + delta);
    if (!peakDay || perDay.get(key)! > peakDay.gained) {
      peakDay = { date: key, gained: perDay.get(key)! };
    }
  }

  // Gains per hour bucket (based on snapshot deltas).
  const perHour = new Map<string, number>();
  for (let i = 1; i < numericPoints.length; i++) {
    const delta = numericPoints[i].v - numericPoints[i - 1].v;
    if (delta <= 0) continue;
    const key = numericPoints[i].t.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    perHour.set(key, (perHour.get(key) ?? 0) + delta);
  }

  return {
    id: reel.id,
    instagramReelId: reel.instagramReelId,
    instagramMediaId: reel.instagramMediaId,
    connectedAccountId: reel.connectedAccountId,
    instagramUrl: reel.instagramUrl,
    normalizedUrl: reel.normalizedUrl,
    username: reel.username,
    caption: reel.caption,
    thumbnailUrl: reel.thumbnailUrl,
    currentViews: reel.currentViews,
    initialViews: reel.initialViews,
    viewsGained: gained,
    growthPercent: growth === null ? null : Math.round(growth * 100) / 100,
    trackingStatus: reel.trackingStatus,
    lastCheckedAt: reel.lastCheckedAt,
    lastError: reel.lastError,
    lastSource: reel.lastSource,
    flaggedForReview: reel.flaggedForReview,
    createdAt: reel.createdAt,
    totalTrackingDurationMs: totalDurationMs,
    peakGrowthPeriod: peakDay,
    perDay: [...perDay.entries()]
      .map(([date, gainedViews]) => ({ date, gained: gainedViews }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    perHour: [...perHour.entries()]
      .map(([hour, gainedViews]) => ({ hour, gained: gainedViews }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    history: history.map((h) => ({
      viewCount: h.viewCount,
      checkedAt: h.checkedAt,
      source: h.source,
      eventType: h.eventType,
      flagged: h.flagged,
      views: h.viewCount, // chart convenience alias — null when the API offered no metric
    })),
  };
}

export async function reelHistory(userId: string, id: string, page = 1, pageSize = 50) {
  const reel = await prisma.reel.findUnique({ where: { id, userId } });
  if (!reel) return null;
  const [rows, total] = await Promise.all([
    prisma.reelViewHistory.findMany({
      where: { reelId: id },
      orderBy: { checkedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reelViewHistory.count({ where: { reelId: id } }),
  ]);
  return { reelId: id, rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function reelEvents(userId: string, id: string, pageSize = 50) {
  const reel = await prisma.reel.findUnique({ where: { id, userId } });
  if (!reel) return null;
  const rows = await prisma.reelEvent.findMany({
    where: { reelId: id },
    orderBy: { createdAt: "desc" },
    take: pageSize,
  });
  return rows.map((e) => ({
    id: e.id,
    kind: e.kind,
    message: e.message,
    meta: e.meta,
    createdAt: e.createdAt,
  }));
}