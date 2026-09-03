import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { deleteAlert, updateAlert } from "@/lib/services/alerts";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  try {
    const updated = await updateAlert(user.id, id, {
      label: body?.label as string | undefined,
      threshold: body?.threshold as number | undefined,
      status: body?.status as "ACTIVE" | "PAUSED" | undefined,
    });
    if (!updated) return apiError("Alert not found.", 404, "NOT_FOUND");
    return json({ alert: { id: updated.id, status: updated.status } });
  } catch (err) {
    return apiError((err as Error).message, 422, "ALERT_ERROR");
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const deleted = await deleteAlert(user.id, id);
  if (!deleted) return apiError("Alert not found.", 404, "NOT_FOUND");
  return json({ ok: true });
}