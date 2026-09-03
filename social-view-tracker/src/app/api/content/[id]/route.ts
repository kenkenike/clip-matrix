import { NextRequest } from "next/server";
import { apiError, bign, getApiUser, json } from "@/lib/api";
import { deleteContent, getContent } from "@/lib/services/content";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const content = await getContent(user.id, id);
  if (!content) return apiError("Content not found.", 404, "NOT_FOUND");
  return json({
    id: content.id,
    platform: content.platform,
    kind: content.kind,
    url: content.url,
    title: content.title,
    caption: content.caption,
    accountName: content.accountName,
    thumbnailUrl: content.thumbnailUrl,
    publishedAt: content.publishedAt,
    status: content.status,
    lastError: content.lastError,
    lastCheckedAt: content.lastCheckedAt,
    views: bign(content.views),
    likes: bign(content.likes),
    comments: bign(content.comments),
    viewsGained: content.viewsGained,
    growthPct: content.growthPct,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  });
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const deleted = await deleteContent(user.id, id);
  if (!deleted) return apiError("Content not found.", 404, "NOT_FOUND");
  return json({ ok: true });
}