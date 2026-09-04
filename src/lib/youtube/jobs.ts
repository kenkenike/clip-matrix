import type { ScrapeJob, YouTubeInsightResult } from "./types";

const jobs = new Map<string, ScrapeJob>();

export function createJob(url: string): ScrapeJob {
  const id = crypto.randomUUID();
  const job: ScrapeJob = {
    id,
    url,
    status: "pending",
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    attempts: 0,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ScrapeJob | null {
  return jobs.get(id) ?? null;
}

export function updateJob(id: string, updates: Partial<Pick<ScrapeJob, "status" | "result" | "error" | "completedAt" | "attempts">>): void {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, updates);
}

export function completeJob(id: string, result: YouTubeInsightResult): void {
  updateJob(id, { status: "completed", result, completedAt: new Date().toISOString() });
}

export function failJob(id: string, error: string): void {
  updateJob(id, { status: "failed", error, completedAt: new Date().toISOString() });
}
