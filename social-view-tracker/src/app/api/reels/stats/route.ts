import { NextRequest } from "next/server";
import { getApiUser, json } from "@/lib/api";
import { reelStats } from "@/lib/services/reels";

export async function GET(_request: NextRequest) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const stats = await reelStats(user.id);

  const { logApiRequest } = await import("@/lib/services/reel-log");
  logApiRequest({
    userId: user.id,
    method: "GET",
    path: "/api/reels/stats",
    status: 200,
    durationMs: Math.round(performance.now() - start),
  });

  return json(stats);
}