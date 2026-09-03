import type { SocialAccount, Transaction } from "@/lib/services/types";

export const accountsSeed: SocialAccount[] = [
  {
    id: "acc-tiktok",
    platform: "tiktok",
    username: "@alexclips",
    followers: 312_400,
    connectedAt: "2025-02-15T10:00:00Z",
    status: "verified",
  },
  {
    id: "acc-instagram",
    platform: "instagram",
    username: "@alexclips",
    followers: 184_200,
    connectedAt: "2025-02-15T10:05:00Z",
    status: "verified",
  },
  {
    id: "acc-youtube",
    platform: "youtube",
    username: "Alex Clips",
    followers: 96_800,
    connectedAt: "2025-03-02T10:00:00Z",
    status: "verified",
  },
  {
    id: "acc-x",
    platform: "x",
    username: null,
    followers: 0,
    connectedAt: null,
    status: "not_connected",
  },
];

type TxnRow = [
  id: string,
  date: string,
  description: string,
  kind: Transaction["kind"],
  amountMinor: number,
  status: Transaction["status"],
  method: Transaction["method"],
  reference: string
];

const txnRows: TxnRow[] = [
  ["tx-01", "2026-08-22", "Nova Podcast earnings", "earning", 602_500, "paid", "bank", "CW-88231"],
  ["tx-02", "2026-08-20", "Payout to bank transfer", "payout", -418_400, "processing", "bank", "PO-55190"],
  ["tx-03", "2026-08-18", "Podium FM Clips earnings", "earning", 616_000, "paid", "bank", "CW-88014"],
  ["tx-04", "2026-08-15", "Lumen Sessions earnings", "earning", 145_800, "paid", "upi", "CW-87722"],
  ["tx-05", "2026-08-12", "Midnight Reel Club earnings", "earning", 103_040, "pending", "upi", "CW-87411"],
  ["tx-06", "2026-08-09", "Cartel Drop 04 earnings (rejected)", "adjustment", -57_900, "rejected", "bank", "AD-12093"],
  ["tx-07", "2026-08-06", "Hexforge Open Beta earnings", "earning", 891_000, "paid", "bank", "CW-87098"],
  ["tx-08", "2026-08-01", "Payout to bank transfer", "payout", -502_300, "paid", "bank", "PO-54902"],
  ["tx-09", "2026-07-28", "Orbit Explainers earnings", "earning", 42_000, "paid", "upi", "CW-86733"],
  ["tx-10", "2026-07-25", "Ledger Lessons earnings", "earning", 119_000, "paid", "upi", "CW-86510"],
];

export const transactionsSeed: Transaction[] = txnRows.map(
  ([id, date, description, kind, amountMinor, status, method, reference]) => ({
    id,
    date: new Date(`${date}T12:00:00Z`).toISOString(),
    description,
    kind,
    amountMinor,
    status,
    method,
    reference,
  })
);
