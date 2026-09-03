/**
 * Background refresh pass for the Instagram Reels module.
 *
 * Runs periodically (default every 30 minutes). For each due reel (active, or
 * failed from a transient API problem retried with backoff) whose last check is
 * older than the configured interval, re-fetches metrics and stores them via
 * the same `refreshReel` path used by the manual API, so the anti-fraud,
 * history, and event logic stays in one place. Errors are recorded per reel
 * and back off exponentially (rate-limited/network failures do not permanently
 * mark a reel failed until MAX_ERRORS_BEFORE_FAIL).
 */
import { prisma } from "@/lib/db";
import { refreshReel } from "@/lib/services/reels";

export const REEL_CHECK_INTERVAL_MS = clampNumber(
  process.env.IG_REEL_CHECK_INTERVAL_MS,
  30 * 60 * 1000,
);
export const REEL_BATCH_SIZE = clampNumber(process.env.REEL_BATCH_SIZE, 200);

function clampNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function refreshReelsDue(): Promise<{ scanned: number; refreshed: number; failed: number }> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let scanned = 0;
  let refreshed = 0;
  let failed = 0;

  for (const user of users) {
    const reels = await prisma.reel.findMany({
      where: { userId: user.id, trackingStatus: { in: ["active", "failed"] } },
      select: {
        id: true,
        lastCheckedAt: true,
        consecutiveErrors: true,
      },
      take: REEL_BATCH_SIZE,
    });

    const now = Date.now();
    const due: Array<{ id: string }> = [];
    for (const reel of reels) {
      scanned += 1;
      if (reel.lastCheckedAt === null) {
        due.push({ id: reel.id });
        continue;
      }
      // Simple exponential backoff for erroring reels.
      const backoff = Math.max(1, reel.consecutiveErrors + 1);
      const minAge = REEL_CHECK_INTERVAL_MS * backoff;
      if (now - reel.lastCheckedAt.getTime() >= minAge) {
        due.push({ id: reel.id });
      }
    }

    for (const reel of due) {
      const result = await refreshReel(user.id, reel.id).catch(() => null);
      if (result?.ok) refreshed += 1;
      else failed += 1;
    }
  }

  return { scanned, refreshed, failed };
}