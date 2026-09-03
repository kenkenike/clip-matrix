import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { WebhookEvent } from "@prisma/client";

const ALL_EVENTS: WebhookEvent[] = ["CONTENT_CHECKED", "ALERT_FIRED", "CONTENT_FAILED"];

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function validWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function listWebhooks(userId: string) {
  return prisma.webhook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWebhook(userId: string, data: {
  name: string;
  url: string;
  events: WebhookEvent[];
}) {
  if (!validWebhookUrl(data.url)) throw new Error("Webhook URL must be a valid http(s) URL.");
  if (!data.name.trim()) throw new Error("Give the webhook a name.");
  const events = data.events.length > 0 ? data.events : ALL_EVENTS;
  return prisma.webhook.create({
    data: {
      userId,
      name: data.name.trim(),
      url: data.url.trim(),
      events,
      secret: generateWebhookSecret(),
      enabled: true,
    },
  });
}

export async function updateWebhook(
  userId: string,
  webhookId: string,
  data: { name?: string; url?: string; events?: WebhookEvent[]; enabled?: boolean },
) {
  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, userId } });
  if (!webhook) return null;
  if (data.url !== undefined && !validWebhookUrl(data.url)) {
    throw new Error("Webhook URL must be a valid http(s) URL.");
  }
  return prisma.webhook.update({
    where: { id: webhookId },
    data: {
      name: data.name,
      url: data.url,
      events: data.events,
      enabled: data.enabled,
      secret: webhook.secret,
    },
  });
}

export async function deleteWebhook(userId: string, webhookId: string) {
  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, userId } });
  if (!webhook) return false;
  await prisma.webhook.delete({ where: { id: webhookId } });
  return true;
}

export async function testWebhook(userId: string, webhookId: string) {
  const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, userId } });
  if (!webhook) return { ok: false as const, error: "Webhook not found." };
  try {
    const payload = {
      event: "CONTENT_CHECKED",
      test: true,
      content: null,
      at: new Date().toISOString(),
    };
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SVT-Event": "CONTENT_CHECKED",
        "X-SVT-Signature": `sha256=${webhook.secret}`,
        "User-Agent": "SocialViewTracker/1.0",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.ok) return { ok: true as const, status: res.status };
    return { ok: false as const, error: `Webhook endpoint returned ${res.status}.` };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}