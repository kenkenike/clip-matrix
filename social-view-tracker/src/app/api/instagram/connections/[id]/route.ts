import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { disconnectConnection } from "@/lib/services/instagram-connections";

export const dynamic = "force-dynamic";

/**
 * Disconnect an Instagram OAuth connection. Reels previously authorized by it
 * keep their rows but move to pending_connection (their connectedAccountId is
 * nulled by the schema's onDelete: SetNull).
 */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;

  const { id } = await context.params;
  const ok = await disconnectConnection(user.id, id);
  if (!ok) return apiError("Connection not found.", 404, "NOT_FOUND");
  return json({ ok: true });
}