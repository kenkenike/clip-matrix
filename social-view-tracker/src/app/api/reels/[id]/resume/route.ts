import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { logApiRequest } from "@/lib/services/reel-log";
import { changeTrackingStatus } from "@/lib/services/reels";

/** Resume tracking for a paused reel. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await context.params;

  const result = await changeTrackingStatus(user.id, id, "active");
  logApiRequest({
    userId: user.id,
    method: "POST",
    path: `/api/reels/${id}/resume`,
    status: result.ok ? 200 : 400,
    durationMs: Math.round(performance.now() - start),
  });
  if (!result.ok) return apiError(result.error, 400, result.code);
  return json({ ok: true });
}