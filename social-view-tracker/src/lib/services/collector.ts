import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getProviders, type SocialProvider } from "@/lib/providers";
import { InstagramProvider } from "@/lib/providers/instagram";
import {
  RateLimitedError,
  type ProviderInput,
  type CollectionResult,
} from "@/lib/providers/types";
import { sleep } from "@/lib/utils";

export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Core metric-collection function. Runs inside the BullMQ worker in
 * production. When Redis is unavailable the queue falls back to running this
 * inline. It performs exactly one upstream API call per job.
 */
export async function runMetricCheck(jobRecordId: string): Promise<void> {
  const job = await prisma.jobRecord.findUnique({ where: { id: jobRecordId } });
  if (!job) return;
  if (!job.contentId) {
    await prisma.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: "failed", error: "Job has no linked content.", updatedAt: new Date() },
    });
    return;
  }

  const content = await prisma.content.findUnique({ where: { id: job.contentId } });
  if (!content) {
    await prisma.jobRecord.update({
      where: { id: jobRecordId },
      data: { status: "failed", error: "Linked content was deleted.", updatedAt: new Date() },
    });
    return;
  }

  await prisma.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: "processing", attempts: { increment: 1 }, updatedAt: new Date() },
  });
  await prisma.content.update({
    where: { id: content.id },
    data: { status: "PROCESSING", lastError: null },
  });

  // Instagram reads are scoped to the content owner's linked accounts, so the
  // provider is built per-user. Every other platform uses a shared singleton.
  let provider: SocialProvider;
  if (content.platform === "INSTAGRAM") {
    const accounts = await prisma.instagramAccount.findMany({
      where: { userId: content.userId },
      select: {
        username: true,
        accessToken: true,
        insightsAccessToken: true,
        sessionCookie: true,
      },
    });
    provider = new InstagramProvider(accounts);
  } else {
    provider = getProviders()[content.platform];
  }

  const input: ProviderInput = {
    url: content.url,
    externalId: content.externalId,
    kind: content.kind ?? "OTHER",
  };

  let result: CollectionResult;
  try {
    result = await provider.getMetrics(input);
  } catch (err) {
    if (err instanceof RateLimitedError) {
      result = { status: "RATE_LIMITED", error: err.message };
    } else if (err instanceof Error) {
      result = { status: "FAILED", error: err.message };
    } else {
      result = { status: "FAILED", error: "Unknown error during collection." };
    }
  }

  await handleCollectResult(jobRecordId, content.id, provider, result);
}

async function handleCollectResult(
  jobRecordId: string,
  contentId: string,
  provider: SocialProvider,
  result: CollectionResult,
): Promise<void> {
  const now = new Date();
  const base = {
    contentId,
    userId: (await prisma.jobRecord.findUnique({ where: { id: jobRecordId } }))?.userId ?? "",
  };

  switch (result.status) {
    case "COMPLETED": {
      const meta = result.metadata ?? {};
      const metrics = result.metrics ?? {};
      const previous = await prisma.content.findUnique({
        where: { id: contentId },
        select: { views: true, likes: true, comments: true },
      });

      const [updated] = await prisma.$transaction([
        prisma.content.update({
          where: { id: contentId },
          data: {
            status: "COMPLETED",
            kind: meta.kind ?? undefined,
            title: meta.title ?? null,
            caption: meta.caption ?? null,
            accountName: meta.accountName ?? null,
            thumbnailUrl: meta.thumbnailUrl ?? null,
            publishedAt: meta.publishedAt ?? null,
            source: result.source ?? null,
            views: metrics.views ?? null,
            likes: metrics.likes ?? null,
            comments: metrics.comments ?? null,
            lastCheckedAt: now,
            lastError: null,
          },
        }),
        prisma.metricSnapshot.create({
          data: {
            contentId,
            userId: base.userId,
            platform: provider.platform,
            url: (await prisma.content.findUnique({ where: { id: contentId } }))?.url ?? "",
            source: result.source ?? null,
            capturedAt: now,
            views: metrics.views ?? null,
            likes: metrics.likes ?? null,
            comments: metrics.comments ?? null,
          },
        }),
        prisma.usage.upsert({
          where: { userId_date: { userId: base.userId, date: startOfToday() } },
          create: { userId: base.userId, date: startOfToday(), checksCount: 1 },
          update: { checksCount: { increment: 1 } },
        }),
      ]);

      await prisma.jobRecord.update({
        where: { id: jobRecordId },
        data: { status: "completed", error: null, updatedAt: now },
      });

      await afterSuccessfulCheck(
        base.userId,
        contentId,
        updated,
        previous?.views === null || previous?.views === undefined ? null : Number(previous.views),
        previous?.likes === null || previous?.likes === undefined ? null : Number(previous.likes),
      );
      return;
    }

    case "UNAVAILABLE": {
      await prisma.$transaction([
        prisma.content.update({
          where: { id: contentId },
          data: { status: "UNAVAILABLE", lastError: result.error ?? null, lastCheckedAt: now },
        }),
        prisma.jobRecord.update({
          where: { id: jobRecordId },
          data: { status: "unavailable", error: result.error ?? null, updatedAt: now },
        }),
      ]);
      return;
    }

    case "RATE_LIMITED": {
      const attempts = await retryOrFail(jobRecordId, contentId, result.error ?? "Rate limited.");
      if (attempts >= MAX_RETRY_ATTEMPTS) return;
      return;
    }

    case "FAILED":
    default: {
      await prisma.$transaction([
        prisma.content.update({
          where: { id: contentId },
          data: { status: "FAILED", lastError: result.error ?? null, lastCheckedAt: now },
        }),
        prisma.jobRecord.update({
          where: { id: jobRecordId },
          data: { status: "failed", error: result.error ?? null, updatedAt: now },
        }),
      ]);
      return;
    }
  }
}

async function retryOrFail(
  jobRecordId: string,
  contentId: string,
  error: string,
): Promise<number> {
  const job = await prisma.jobRecord.update({
    where: { id: jobRecordId },
    data: { status: "rate_limited", error, updatedAt: new Date() },
  });
  const attempts = job.attempts;
  const failed = attempts >= MAX_RETRY_ATTEMPTS;
  await prisma.content.update({
    where: { id: contentId },
    data: {
      status: failed ? "RATE_LIMITED" : "RATE_LIMITED",
      lastError: error,
      lastCheckedAt: new Date(),
    },
  });
  if (!failed) {
    const waitSeconds = Math.min(900, 30 * 2 ** (attempts - 1)) + Math.floor(Math.random() * 10);
    await sleep(waitSeconds * 1000);
    const { enqueueRaw } = await import("@/lib/queue");
    await enqueueRaw({ jobRecordId, userId: job.userId });
    return attempts;
  }
  return attempts;
}

/**
 * After a successful check: evaluate view alerts and deliver webhooks.
 */
async function afterSuccessfulCheck(
  userId: string,
  contentId: string,
  content: {
    url: string;
    platform: string;
    title: string | null;
    views: bigint | null;
    likes: bigint | null;
    comments: bigint | null;
  },
  previousViews: number | null,
  previousLikes: number | null,
): Promise<void> {
  const [alerts, webhooks] = await Promise.all([
    prisma.viewAlert.findMany({
      where: { userId, contentId, status: { in: ["ACTIVE", "FIRED"] } },
    }),
    prisma.webhook.findMany({ where: { userId, enabled: true } }),
  ]);

  const views = content.views === null || content.views === undefined ? null : Number(content.views);
  const likes = content.likes === null || content.likes === undefined ? null : Number(content.likes);

  const deliveries = await evaluateAlerts(userId, contentId, alerts, {
    views,
    likes,
    previousViews,
    previousLikes,
  });

  const webhookEvents: string[] = ["CONTENT_CHECKED"];
  if (deliveries.some((d) => d.fired)) webhookEvents.push("ALERT_FIRED");

  const relevant = webhooks.filter((w) => w.events.some((e) => webhookEvents.includes(e)));
  await Promise.all(
    relevant.map((w) =>
      deliverWebhook(w.id, w.url, w.secret, {
        event: deliveries.some((d) => d.fired) ? "ALERT_FIRED" : "CONTENT_CHECKED",
        content: {
          id: contentId,
          url: content.url,
          platform: content.platform,
          title: content.title,
          views,
          likes,
          comments: content.comments === null ? null : Number(content.comments),
          checkedAt: new Date().toISOString(),
        },
      }),
    ),
  );
}

async function evaluateAlerts(
  userId: string,
  contentId: string,
  alerts: Array<{
    id: string;
    kind: string;
    label: string;
    config: unknown;
    status: string;
    firedCount: number;
    lastTriggeredAt: Date | null;
  }>,
  data: { views: number | null; likes: number | null; previousViews: number | null; previousLikes: number | null },
): Promise<Array<{ alertId: string; fired: boolean }>> {
  const results: Array<{ alertId: string; fired: boolean }> = [];
  for (const alert of alerts) {
    const config = (alert.config ?? {}) as Record<string, unknown>;
    const threshold = Number(config.threshold ?? 0);
    let fired = false;
    let payload: Record<string, unknown> = {};

    if (alert.kind === "VIEW_MILESTONE") {
      const prev = data.previousViews ?? 0;
      const nowV = data.views ?? 0;
      if (alert.status === "ACTIVE" && nowV >= threshold && prev < threshold) {
        fired = true;
        payload = { threshold, views: nowV, reachedAt: new Date().toISOString() };
      }
    } else if (alert.kind === "VIEW_SPIKE") {
      const gained = (data.views ?? 0) - (data.previousViews ?? 0);
      if (alert.status === "ACTIVE" && gained >= threshold) {
        fired = true;
        payload = { gained, views: data.views ?? 0, previousViews: data.previousViews ?? 0 };
      }
    } else if (alert.kind === "GROWTH_THRESHOLD") {
      const prev = data.previousViews ?? 0;
      const nowV = data.views ?? 0;
      if (alert.status === "ACTIVE" && prev > 0) {
        const growth = ((nowV - prev) / prev) * 100;
        if (growth >= threshold) {
          fired = true;
          payload = { growthPct: Math.round(growth * 100) / 100, views: nowV, previousViews: prev };
        }
      }
    }

    if (fired) {
      await prisma.viewAlert.update({
        where: { id: alert.id },
        data: { status: "FIRED", lastTriggeredAt: new Date(), firedCount: { increment: 1 } },
      });
      const delivery = await recordAlertDelivery(alert.id, userId, payload);
      await notifyUser(userId, alert, payload, delivery.channel, delivery.error);
    }
    results.push({ alertId: alert.id, fired });
  }
  return results;
}

async function recordAlertDelivery(
  alertId: string,
  userId: string,
  payload: Record<string, unknown>,
): Promise<{ channel: string; error: string | null }> {
  const alert = await prisma.viewAlert.findUnique({ where: { id: alertId } });
  if (!alert) return { channel: "email", error: "Alert not found." };
  const { sendEmailNotification } = await import("@/lib/services/notify");
  const result = await sendEmailNotification({
    userId,
    subject: `View alert: ${alert.label}`,
    text: `${alert.label}\n\nPayload: ${JSON.stringify(payload, null, 2)}\n\nView the dashboard at ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/app`,
  });
  await prisma.alertDelivery.create({
    data: {
      alertId,
      channel: "email",
      payload: payload as unknown as Prisma.InputJsonValue,
      delivered: result.delivered,
      error: result.error,
    },
  });
  return { channel: "email", error: result.error };
}

async function notifyUser(
  userId: string,
  alert: { id: string; label: string },
  payload: Record<string, unknown>,
  channel: string,
  error: string | null,
) {
  // Webhook delivery for alerts is handled by the webhook fan-out above
  // (ALERT_FIRED event). Email delivery is handled in recordAlertDelivery.
  void userId;
  void alert;
  void payload;
  void channel;
  void error;
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: { event: string; content: unknown },
) {
  try {
    const body = JSON.stringify(payload);
    const signature =
      secret && secret !== ""
        ? `sha256=${await hmacSha256(secret, body)}`
        : undefined;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "X-SVT-Signature": signature } : {}),
        "X-SVT-Event": payload.event,
        "User-Agent": "SocialViewTracker/1.0",
      },
      body,
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Webhook ${webhookId} returned ${res.status}`);
    }
  } catch (err) {
    console.warn(`Webhook ${webhookId} delivery failed: ${(err as Error).message}`);
  }
}

async function hmacSha256(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}