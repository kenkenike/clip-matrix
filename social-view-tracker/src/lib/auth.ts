import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { PlanId, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";

export type CurrentUser = Omit<Partial<User>, "plan"> & {
  id?: string;
  plan?: {
    plan: PlanId;
    status: string;
    maxContent: number;
    maxApiKeys: number;
    checkIntervalMinutes: number;
    renewsAt: Date | null;
  } | null;
};

/**
 * Returns the authenticated user id or null. Safe to call anywhere on the server.
 */
export const getSessionUser = cache(async (): Promise<string | null> => {
  const session = await readSession();
  return session?.userId ?? null;
});

/**
 * Returns the authenticated user (DB record with select fields) or null.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUser();
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        googleId: true,
        createdAt: true,
        plan: { select: { plan: true, status: true, maxContent: true, maxApiKeys: true, checkIntervalMinutes: true, renewsAt: true } },
      },
    });
    return user;
  } catch {
    return null;
  }
});

/**
 * Requires an authenticated user: redirects to /login when there is no session.
 */
export const requireUser = cache(async (): Promise<CurrentUser | null> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});

/**
 * Returns the user's effective plan limits, falling back to sensible defaults
 * when no plan record exists yet.
 */
export async function getEffectivePlan(userId: string) {
  const plan = await prisma.userPlan.findUnique({ where: { userId } });
  if (plan) {
    return {
      plan: plan.plan,
      maxContent: plan.maxContent,
      maxApiKeys: plan.maxApiKeys,
      checkIntervalMinutes: plan.checkIntervalMinutes,
    };
  }
  return {
    plan: "FREE" as const,
    maxContent: 10,
    maxApiKeys: 1,
    checkIntervalMinutes: 1440,
  };
}