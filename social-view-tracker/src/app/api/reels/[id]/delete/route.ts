import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { logApiRequest } from "@/lib/services/reel-log";
import { deleteReel } from "@/lib/services/reels";

/** Delete a reel (admin only). Cascade removes its view history and events. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const authed = await getCurrentUser();
  if (authed?.role !== "ADMIN") {
    return apiError("Admin access required.", 403, "FORBIDDEN");
  }

  const { id } = await context.params;
  const result = await deleteReel(user.id, id);
  logApiRequest({
    userId: user.id,
    method: "POST",
    path: `/api/reels/${id}/delete`,
    status: result.ok ? 200 : 404,
    durationMs: Math.round(performance.now() - start),
  });
  if (!result.ok) return apiError(result.error, 404, result.code);
  return json({ ok: true });
}