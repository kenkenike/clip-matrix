export const PLAN_LIMITS = {
  FREE: { maxContent: 10, maxApiKeys: 1, checkIntervalMinutes: 1440, label: "Free" },
  STARTER: { maxContent: 50, maxApiKeys: 5, checkIntervalMinutes: 360, label: "Starter" },
  PRO: { maxContent: 500, maxApiKeys: 20, checkIntervalMinutes: 60, label: "Pro" },
  TEAM: { maxContent: 5000, maxApiKeys: 100, checkIntervalMinutes: 15, label: "Team" },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function planLimits(plan: PlanKey) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}