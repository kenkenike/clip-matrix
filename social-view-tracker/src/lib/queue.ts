import { Queue } from "bullmq";
import { runMetricCheck, MAX_RETRY_ATTEMPTS } from "@/lib/services/collector";

export type TrackJobData = {
  jobRecordId: string;
  userId: string;
};

const QUEUE_NAME = "metric-checks";
let queueInstance: Queue | null = null;
let redisConfigured: boolean | null = null;

function redisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim();
  return url ? url : null;
}

export function isRedisConfigured(): boolean {
  if (redisConfigured === null) redisConfigured = redisUrl() !== null;
  return redisConfigured;
}

export function getQueue(): Queue | null {
  if (!isRedisConfigured()) return null;
  if (!queueInstance) {
    queueInstance = new Queue(QUEUE_NAME, {
      connection: { url: redisUrl() as string, maxRetriesPerRequest: null },
      defaultJobOptions: {
        attempts: MAX_RETRY_ATTEMPTS,
        backoff: { type: "exponential", delay: 60000 },
        removeOnComplete: 500,
        removeOnFail: 2000,
      },
    });
  }
  return queueInstance;
}

/**
 * Enqueues a metric-check job. Returns true when the job went to Redis, false
 * when it fell back to the in-process queue.
 */
export function enqueueRaw(job: TrackJobData): boolean {
  const queue = getQueue();
  if (queue) {
    void queue.add(QUEUE_NAME, job, {
      jobId: job.jobRecordId,
    });
    return true;
  }
  fallbackQueue.push(job);
  setImmediate(drainFallback);
  return false;
}

// ---------------------------------------------------------------------------
// In-process fallback queue (used when REDIS_URL is not configured). Keeps the
// application fully functional in local development without infrastructure.
// ---------------------------------------------------------------------------

const FALLBACK_CONCURRENCY = 2;
const fallbackQueue: TrackJobData[] = [];
let fallbackRunning = 0;

function drainFallback() {
  while (fallbackRunning < FALLBACK_CONCURRENCY && fallbackQueue.length > 0) {
    const job = fallbackQueue.shift();
    if (!job) continue;
    fallbackRunning += 1;
    void (async () => {
      try {
        await runMetricCheck(job.jobRecordId);
      } catch (err) {
        console.error("[queue][fallback] metric check failed", err);
      } finally {
        fallbackRunning -= 1;
        drainFallback();
      }
    })();
  }
}