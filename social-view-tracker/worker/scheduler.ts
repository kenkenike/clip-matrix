/*
 * Scheduled recheck scheduler.
 *
 * Periodically finds content whose last check is older than the user's plan
 * checkIntervalMinutes and enqueues fresh metric-check jobs. Emits the
 * CONTENT_FAILED webhook for FAILED / UNAVAILABLE content that has not been
 * announced yet.
 *
 * Start with: npm run scheduler
 */
import { prisma } from "../src/lib/db";
import { enqueueRaw } from "../src/lib/queue";
import { refreshReelsDue, REEL_CHECK_INTERVAL_MS } from "../src/lib/services/reel-scheduler";

const HEARTBEAT_MS = Math.max(10_000, Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000));
const STALE_THRESHOLD = 30 * 60 * 1000; // never check content more often than this

async function recheckStaleContent() {
  const users = await prisma.user.findMany({
    select: { id: true, plan: { select: { checkIntervalMinutes: true, status: true } } },
  });
  if (users.length === 0) return;

  const now = new Date();
  let scanned = 0;
  let enqueued = 0;

  for (const user of users) {
    const intervalMs = (user.plan?.checkIntervalMinutes ?? 1440) * 60 * 1000;
    const minAllowedAge = Math.max(intervalMs, STALE_THRESHOLD);
    const cutoff = new Date(now.getTime() - minAllowedAge);

    const stale = await prisma.content.findMany({
      where: {
        userId: user.id,
        status: { not: "PROCESSING" },
        OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }],
      },
      select: { id: true, url: true },
      take: 200,
    });

    for (const content of stale) {
      scanned += 1;
      if (enqueued >= 400) break;
      const job = await prisma.jobRecord.create({
        data: { userId: user.id, contentId: content.id, url: content.url, status: "queued" },
      });
      enqueueRaw({ jobRecordId: job.id, userId: user.id });
      enqueued += 1;
    }
    if (enqueued >= 400) break;
  }

  console.log(`[scheduler] scanned ${scanned} stale items, enqueued ${enqueued} checks`);
}

async function refreshReelsPass() {
  const result = await refreshReelsDue();
  console.log(
    `[scheduler] reels: scanned ${result.scanned}, refreshed ${result.refreshed}, failed ${result.failed}`,
  );
}

async function main() {
  console.log(`[scheduler] started (heartbeat ${HEARTBEAT_MS}ms)`);

  // Kick off immediately, then on an interval.
  await recheckStaleContent().catch((err) =>
    console.error("[scheduler] initial run failed", err),
  );
  await refreshReelsPass().catch((err) =>
    console.error("[scheduler] initial reels run failed", err),
  );

  const timer = setInterval(() => {
    void recheckStaleContent().catch((err) =>
      console.error("[scheduler] run failed", err),
    );
  }, HEARTBEAT_MS);

  // Separate cadence for the reel refresher (default 30 minutes).
  const reelsTimer = setInterval(() => {
    void refreshReelsPass().catch((err) =>
      console.error("[scheduler] reels run failed", err),
    );
  }, Math.max(REEL_CHECK_INTERVAL_MS, 60_000));

  const shutdown = async () => {
    clearInterval(timer);
    clearInterval(reelsTimer);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("[scheduler] fatal", err);
  process.exit(1);
});