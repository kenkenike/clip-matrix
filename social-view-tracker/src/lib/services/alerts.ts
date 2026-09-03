import { prisma } from "@/lib/db";
import type { AlertKind } from "@prisma/client";

export async function listAlerts(userId: string) {
  return prisma.viewAlert.findMany({
    where: { userId },
    include: { content: { select: { id: true, title: true, url: true, platform: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAlert(userId: string, data: {
  label: string;
  kind: AlertKind;
  threshold: number;
  contentId?: string | null;
}) {
  const threshold = Number(data.threshold);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error("Alert threshold must be a positive number.");
  }
  if (data.contentId) {
    const content = await prisma.content.findFirst({
      where: { id: data.contentId, userId },
    });
    if (!content) throw new Error("Content not found.");
  }
  return prisma.viewAlert.create({
    data: {
      userId,
      label: data.label,
      kind: data.kind,
      contentId: data.contentId ?? null,
      config: { threshold },
      status: "ACTIVE",
    },
  });
}

export async function updateAlert(
  userId: string,
  alertId: string,
  data: { label?: string; threshold?: number; status?: "ACTIVE" | "PAUSED" | "FIRED" },
) {
  const alert = await prisma.viewAlert.findFirst({ where: { id: alertId, userId } });
  if (!alert) return null;
  const patch: Record<string, unknown> = { label: data.label };
  if (data.threshold !== undefined) {
    const threshold = Number(data.threshold);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      throw new Error("Alert threshold must be a positive number.");
    }
    patch.config = { threshold };
  }
  if (data.status && data.status !== "FIRED") patch.status = data.status;
  return prisma.viewAlert.update({ where: { id: alertId }, data: patch });
}

export async function deleteAlert(userId: string, alertId: string) {
  const alert = await prisma.viewAlert.findFirst({ where: { id: alertId, userId } });
  if (!alert) return false;
  await prisma.$transaction([
    prisma.alertDelivery.deleteMany({ where: { alertId } }),
    prisma.viewAlert.delete({ where: { id: alertId } }),
  ]);
  return true;
}