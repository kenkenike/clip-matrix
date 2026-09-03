import { prisma } from "@/lib/db";
import { planLimits, type PlanKey } from "@/lib/plans";

export async function getUsage(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [plan, todayUsage, contentCount, apiKeyCount] = await Promise.all([
    prisma.userPlan.findUnique({ where: { userId } }),
    prisma.usage.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.content.count({ where: { userId } }),
    prisma.apiKey.count({ where: { userId, revokedAt: null } }),
  ]);

  const limits = planLimits((plan?.plan ?? "FREE") as PlanKey);
  return {
    plan: (plan?.plan ?? "FREE") as string,
    planStatus: plan?.status ?? "active",
    limits,
    usage: {
      content: contentCount,
      maxContent: plan?.maxContent ?? limits.maxContent,
      apiKeys: apiKeyCount,
      maxApiKeys: plan?.maxApiKeys ?? limits.maxApiKeys,
      checksToday: todayUsage?.checksCount ?? 0,
      apiCallsToday: todayUsage?.apiCallsCount ?? 0,
      checkIntervalMinutes: plan?.checkIntervalMinutes ?? limits.checkIntervalMinutes,
    },
  };
}

export async function recordApiCall(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  await prisma.usage.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, apiCallsCount: 1 },
    update: { apiCallsCount: { increment: 1 } },
  });
}