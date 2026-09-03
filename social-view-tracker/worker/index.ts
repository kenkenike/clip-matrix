/*
 * Metric collection worker.
 *
 * Reads "metric-checks" jobs from Redis (BullMQ) when REDIS_URL is set. When
 * Redis is not configured the Next.js process itself drains an in-process
 * fallback queue (see src/lib/queue.ts) so no separate worker process is
 * needed for local development.
 *
 * Start with: npm run worker
 */
import { Worker, type Job } from "bullmq";
import { prisma } from "../src/lib/db";
import { runMetricCheck } from "../src/lib/services/collector";

const QUEUE_NAME = "metric-checks";

async function main() {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    console.log("[worker] REDIS_URL not set. The in-process fallback queue inside the Next.js app handles jobs.");
    console.log("[worker] No BullMQ worker required. Exiting.");
    process.exit(0);
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const data = job.data as { jobRecordId?: string };
      if (!data.jobRecordId) {
        throw new Error("Job payload missing jobRecordId.");
      }
      await runMetricCheck(data.jobRecordId);
    },
    {
      connection: { url: redisUrl, maxRetriesPerRequest: null },
      concurrency: 2,
      lockDuration: 60_000,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[worker] completed ${job.id}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[worker] failed ${job?.id}: ${err.message}`);
  });
  worker.on("error", (err) => {
    console.error(`[worker] connection error: ${err.message}`);
  });

  const shutdown = async () => {
    console.log("[worker] shutting down");
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  console.log(`[worker] listening on "${QUEUE_NAME}" (redis at ${redisUrl.replace(/\/\/.*@/, "//***@")})`);
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});