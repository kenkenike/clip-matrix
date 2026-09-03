/**
 * Audit trail for the Instagram Reels module: per-reel events (refresh,
 * errors, status changes, suspicion flags) and API request logging used by the
 * admin views. Writes are fire-and-forget so failures here never break the
 * request that triggered them.
 */
import { prisma } from "@/lib/db";

export type ReelEventKind =
  | "created"
  | "refresh"
  | "error"
  | "flag"
  | "status_change";

export async function logReelEvent(
  userId: string,
  reelId: string,
  kind: ReelEventKind,
  message: string,
  meta?: Record<string, unknown> | string | null,
): Promise<void> {
  try {
    await prisma.reelEvent.create({
      data: {
        userId,
        reelId,
        kind,
        message,
        meta: typeof meta === "string" ? meta : meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // Audit logging must never fail the caller.
  }
}

/** Non-blocking API request log. */
export function logApiRequest(input: {
  userId?: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip?: string | null;
}): void {
  void prisma.apiRequestLog
    .create({
      data: {
        userId: input.userId ?? null,
        method: input.method,
        path: input.path,
        status: input.status,
        durationMs: input.durationMs,
        ip: input.ip ?? null,
      },
    })
    .catch(() => {});
}