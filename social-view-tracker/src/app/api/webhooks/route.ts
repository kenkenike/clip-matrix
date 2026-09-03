import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { createWebhook, listWebhooks } from "@/lib/services/webhooks";

const schema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  events: z.array(z.enum(["CONTENT_CHECKED", "ALERT_FIRED", "CONTENT_FAILED"])).min(1),
});

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const webhooks = await listWebhooks(user.id);
  return json({ webhooks });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser();
  if (error) return error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid webhook payload.", 422, "VALIDATION", parsed.error.flatten().fieldErrors);
  }
  try {
    const webhook = await createWebhook(user.id, parsed.data);
    return json({ webhook }, { status: 201 });
  } catch (err) {
    return apiError((err as Error).message, 422, "WEBHOOK_ERROR");
  }
}