import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { logApiRequest } from "@/lib/services/reel-log";
import { reelDetail, reelEvents, reelHistory } from "@/lib/services/reels";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const { id } = await context.params;
  const detail = await reelDetail(user.id, id);
  if (!detail) return apiError("Reel not found.", 404, "NOT_FOUND");

  const authed = await getCurrentUser();
  const section = request.nextUrl.searchParams.get("section");
  let payload: unknown = { ...detail, isAdmin: authed?.role === "ADMIN" };
  if (section === "history") {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1) || 1);
    payload = await reelHistory(user.id, id, page, 50);
  } else if (section === "events") {
    payload = { events: await reelEvents(user.id, id) };
  }

  logApiRequest({
    userId: user.id,
    method: "GET",
    path: `/api/reels/${id}`,
    status: 200,
    durationMs: Math.round(performance.now() - start),
  });

  return json(payload);
}