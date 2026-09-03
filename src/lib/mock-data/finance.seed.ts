import type { EarningsEntry, PayoutMethod, Balances } from "@/lib/services/types";

type EarningRow = [
  id: string,
  date: string,
  campaignId: string,
  campaignName: string,
  views: number,
  amountMinor: number,
  status: EarningsEntry["status"]
];

const earningRows: EarningRow[] = [
  ["e-01", "2026-08-22", "nova-podcast", "Nova Podcast", 2_410_000, 602_500, "Paid"],
  ["e-02", "2026-08-20", "alpha-arena", "Alpha Arena", 840_000, 420_000, "Pending"],
  ["e-03", "2026-08-18", "podium-fm-clips", "Podium FM Clips", 1_120_000, 616_000, "Paid"],
  ["e-04", "2026-08-15", "lumen-sessions", "Lumen Sessions", 486_000, 145_800, "Paid"],
  ["e-05", "2026-08-12", "midnight-reel-club", "Midnight Reel Club", 322_000, 103_040, "Processing"],
  ["e-06", "2026-08-09", "cartel-drop-04", "Cartel Drop 04", 96_500, 57_900, "Rejected"],
  ["e-07", "2026-08-06", "hexforge-beta", "Hexforge Open Beta", 1_980_000, 891_000, "Paid"],
  ["e-08", "2026-08-03", "orbit-explainers", "Orbit Explainers", 210_000, 42_000, "Paid"],
  ["e-09", "2026-07-29", "statline-sync", "Statline Sync", 74_200, 29_680, "Paid"],
  ["e-10", "2026-07-25", "ledger-lessons", "Ledger Lessons", 340_000, 119_000, "Paid"],
];

export const earningsSeed: EarningsEntry[] = earningRows.map(
  ([id, date, campaignId, campaignName, views, amountMinor, status]) => ({
    id,
    date: new Date(`${date}T12:00:00Z`).toISOString(),
    campaignId,
    campaignName,
    views,
    amountMinor,
    status,
    method: "bank",
  })
);

export const balancesSeed: Balances = {
  availableMinor: 420_020,
  pendingMinor: 62_000,
  lifetimeMinor: 1_834_055,
  thisMonthMinor: 124_020,
  nextPayoutDate: "2026-09-01T12:00:00Z",
  minimumWithdrawalMinor: 5_000,
};

export const payoutMethodsSeed: PayoutMethod[] = [
  {
    id: "pm-bank",
    kind: "bank",
    label: "Bank transfer",
    maskedIdentifier: "Checking ****4821",
    isDefault: false,
    addedAt: "2025-03-11T10:00:00Z",
  },
  {
    id: "pm-upi",
    kind: "upi",
    label: "UPI",
    maskedIdentifier: "Not set up",
    isDefault: false,
    addedAt: "2025-05-02T10:00:00Z",
  },
];
