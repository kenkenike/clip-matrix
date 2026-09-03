import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { logApiRequest } from "@/lib/services/reel-log";
import { refreshReel } from "@/lib/services/reels";

/** Manually trigger a refresh (re-check) for a reel. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await context.params;

  const result = await refreshReel(user.id, id, { manual: true });
  logApiRequest({
    userId: user.id,
    method: "POST",
    path: `/api/reels/${id}/refresh`,
    status: result.ok ? 200 : 404,
    durationMs: Math.round(performance.now() - start),
  });
  if (!result.ok) return apiError(result.error, 404, result.code);
  return json({ ok: true, reel: result.reel });
}