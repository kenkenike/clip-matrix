import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { revokeApiKey } from "@/lib/services/api-key";

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const revoked = await revokeApiKey(user.id, id);
  if (!revoked) return apiError("API key not found.", 404, "NOT_FOUND");
  return json({ ok: true });
}