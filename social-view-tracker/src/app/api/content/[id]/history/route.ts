import { NextRequest } from "next/server";
import { apiError, bign, getApiUser, json } from "@/lib/api";
import { getContentHistory } from "@/lib/services/content";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const result = await getContentHistory(user.id, id);
  if (!result) return apiError("Content not found.", 404, "NOT_FOUND");
  return json({
    content: {
      id: result.content.id,
      title: result.content.title,
      url: result.content.url,
      platform: result.content.platform,
    },
    snapshots: result.snapshots.map((s) => ({
      id: s.id,
      capturedAt: s.capturedAt,
      views: bign(s.views),
      likes: bign(s.likes),
      comments: bign(s.comments),
    })),
  });
}