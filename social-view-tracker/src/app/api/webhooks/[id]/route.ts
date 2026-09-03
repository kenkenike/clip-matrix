import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { deleteWebhook, testWebhook, updateWebhook } from "@/lib/services/webhooks";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  events: z.array(z.enum(["CONTENT_CHECKED", "ALERT_FIRED", "CONTENT_FAILED"])).min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid webhook payload.", 422, "VALIDATION");
  }
  try {
    const webhook = await updateWebhook(user.id, id, parsed.data);
    if (!webhook) return apiError("Webhook not found.", 404, "NOT_FOUND");
    return json({ webhook });
  } catch (err) {
    return apiError((err as Error).message, 422, "WEBHOOK_ERROR");
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const deleted = await deleteWebhook(user.id, id);
  if (!deleted) return apiError("Webhook not found.", 404, "NOT_FOUND");
  return json({ ok: true });
}

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;
  const result = await testWebhook(user.id, id);
  if (!result.ok) return apiError(result.error, 422, "WEBHOOK_TEST_FAILED");
  return json({ ok: true, status: result.status });
}