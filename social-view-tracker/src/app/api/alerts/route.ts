import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { createAlert, listAlerts } from "@/lib/services/alerts";

const schema = z.object({
  label: z.string().min(1).max(120).trim(),
  kind: z.enum(["VIEW_MILESTONE", "VIEW_SPIKE", "GROWTH_THRESHOLD", "MANUAL"]),
  threshold: z.number().positive(),
  contentId: z.string().optional().nullable(),
});

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const alerts = await listAlerts(user.id);
  return json({
    alerts: alerts.map((a) => ({
      id: a.id,
      label: a.label,
      kind: a.kind,
      threshold: Number((a.config as { threshold?: number } | null)?.threshold ?? 0),
      status: a.status,
      firedCount: a.firedCount,
      lastTriggeredAt: a.lastTriggeredAt,
      createdAt: a.createdAt,
      content: a.content
        ? { id: a.content.id, title: a.content.title, url: a.content.url, platform: a.content.platform }
        : null,
    })),
  });
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
    return apiError("Invalid alert payload.", 422, "VALIDATION", parsed.error.flatten().fieldErrors);
  }
  try {
    const alert = await createAlert(user.id, parsed.data);
    return json({ alert: { id: alert.id, label: alert.label, kind: alert.kind, status: alert.status } }, { status: 201 });
  } catch (err) {
    return apiError((err as Error).message, 422, "ALERT_ERROR");
  }
}