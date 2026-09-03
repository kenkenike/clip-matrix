import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logApiRequest } from "@/lib/services/reel-log";

/** Admin diagnostics: API request logs, suspicion-flagged reels, error events. */
export async function GET(_request: NextRequest) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const authed = await getCurrentUser();
  if (authed?.role !== "ADMIN") {
    return apiError("Admin access required.", 403, "FORBIDDEN");
  }

  const [apiLogs, flaggedReels, errorEvents] = await Promise.all([
    prisma.apiRequestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        method: true,
        path: true,
        status: true,
        durationMs: true,
        ip: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.reel.findMany({
      where: { userId: user.id, flaggedForReview: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        instagramReelId: true,
        username: true,
        currentViews: true,
        trackingStatus: true,
        updatedAt: true,
      },
    }),
    prisma.reelEvent.findMany({
      where: {
        userId: user.id,
        OR: [{ kind: "error" }, { kind: "flag" }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        message: true,
        meta: true,
        createdAt: true,
        reel: { select: { instagramReelId: true } },
      },
    }),
  ]);

  logApiRequest({
    userId: user.id,
    method: "GET",
    path: "/api/reels/admin/logs",
    status: 200,
    durationMs: Math.round(performance.now() - start),
  });

  return json({ apiLogs, flaggedReels, errorEvents });
}