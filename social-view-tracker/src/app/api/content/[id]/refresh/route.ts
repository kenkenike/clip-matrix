import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { refreshContent } from "@/lib/services/content";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const content = await refreshContent(user.id, id);
  if (!content) return apiError("Content not found.", 404, "NOT_FOUND");
  return json({
    ok: true,
    contentId: content.id,
    status: content.status,
    note: "Refresh queued. The worker will re-collect public metrics shortly.",
  });
}