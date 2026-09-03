import type { AdminPayout, Clip, FraudAssessment, TimeSeriesPoint } from "@/lib/services/types";

const fraudByClip: Record<string, FraudAssessment> = {
  "clip-001": {
    score: 7,
    level: "LOW",
    signals: ["platform_api_verification"],
    note: "",
  },
  "clip-002": {
    score: 12,
    level: "LOW",
    signals: ["platform_api_verification", "follower_view_ratio"],
    note: "",
  },
  "clip-003": {
    score: 18,
    level: "LOW",
    signals: ["view_velocity"],
    note: "",
  },
  "clip-004": {
    score: 44,
    level: "MEDIUM",
    signals: ["view_velocity", "engagement_velocity"],
    note: "",
  },
  "clip-005": {
    score: 9,
    level: "LOW",
    signals: ["platform_api_verification"],
    note: "",
  },
  "clip-006": {
    score: 81,
    level: "HIGH",
    signals: ["duplicate_content", "bot_like_engagement", "view_velocity"],
    note: "",
  },
  "clip-007": {
    score: 22,
    level: "LOW",
    signals: ["follower_view_ratio"],
    note: "",
  },
  "clip-010": {
    score: 63,
    level: "MEDIUM",
    signals: ["bot_like_engagement", "engagement_velocity"],
    note: "",
  },
};

export function attachFraud(clips: Clip[]): Clip[] {
  return clips.map((clip) => ({
    ...clip,
    fraudScore:
      fraudByClip[clip.id] ?? {
        score: (clip.id.length * 13) % 30,
        level: "LOW" as const,
        signals: ["platform_api_verification"],
        note: "",
      },
  }));
}

const clipTitles: Record<string, string> = {
  "clip-001": "I tried Nova's morning routine for 30 days",
  "clip-002": "Alpha Arena ranked: top 5 plays of the week",
  "clip-003": "The take nobody expected on Podium FM",
  "clip-004": "Midnight Reel Club: the 12am drop",
  "clip-005": "Lumen Sessions acoustic cut",
  "clip-006": "This Cartel piece sold out in minutes",
  "clip-007": "Statline Sync: the stat that broke chat",
  "clip-008": "Orbit Explainers: gravity, briefly",
  "clip-009": "Hexforge beta is unplayable (in a good way)",
  "clip-010": "Ledger Lessons: cold wallets explained",
  "clip-011": "Midnight Reel Club after hours",
  "clip-012": "Cartel Drop 04 fit check",
  "clip-013": "Podium FM hot mic moment",
  "clip-014": "Alpha Arena clutch compilation",
};

export function withTitles(clips: Clip[]): Clip[] {
  return clips.map((clip) => (clipTitles[clip.id] ? { ...clip, title: clipTitles[clip.id] } : clip));
}

type UserRow = [
  id: string,
  name: string,
  handle: string,
  role: "creator" | "brand" | "moderator" | "admin",
  email: string,
  status: "active" | "suspended" | "pending",
  joinedAt: string,
  lifetimeValueMinor: number
];

const userRows: UserRow[] = [
  ["u-01", "Alex Rivera", "@alexclips", "creator", "alex.rivera@email.com", "active", "2025-02-14", 1_834_055],
  ["u-02", "Bianca Cho", "@biancacreates", "creator", "bianca.cho@email.com", "active", "2025-04-03", 1_326_000],
  ["u-03", "Caleb Wright", "@calebcuts", "creator", "caleb.wright@email.com", "active", "2025-05-19", 1_041_000],
  ["u-04", "Northbeam Labs", "northbeam", "brand", "team@northbeam.io", "active", "2025-01-08", 24_800_000],
  ["u-05", "Hexforge Games", "hexforge", "brand", "ops@hexforge.gg", "active", "2025-01-22", 41_200_000],
  ["u-06", "Dana Okafor", "@danadrops", "creator", "dana.okafor@email.com", "active", "2025-06-01", 862_400],
  ["u-07", "Trent Mallow", "@trentspams", "creator", "trent.mallow@email.com", "suspended", "2026-03-12", 0],
  ["u-08", "Cartel Supply", "cartelsupply", "brand", "media@cartelsupply.co", "pending", "2026-08-20", 0],
  ["u-09", "Farah Aziz", "@farahfilms", "creator", "farah.aziz@email.com", "active", "2025-08-08", 588_900],
  ["u-10", "Lumen Audio", "lumenaudio", "brand", "growth@lumen.audio", "active", "2025-02-02", 33_100_000],
  ["u-11", "Priya Nair", "@priyareviews", "moderator", "priya.nair@clipmatrix.co", "active", "2024-11-30", 0],
  ["u-12", "Marcus Webb", "@mwebb", "admin", "marcus@clipmatrix.co", "active", "2024-10-12", 0],
];

export const adminUsersSeed = userRows.map(
  ([id, name, handle, role, email, status, joinedAt, lifetimeValueMinor]) => ({
    id,
    name,
    handle,
    role,
    email,
    status,
    joinedAt: new Date(`${joinedAt}T10:00:00Z`).toISOString(),
    lifetimeValueMinor,
  })
);

type PayoutRow = [
  id: string,
  creator: string,
  method: AdminPayout["method"],
  paymentDetail: string,
  amountMinor: number,
  requestedAt: string,
  status: AdminPayout["status"]
];

const payoutRows: PayoutRow[] = [
  ["po-01", "Alex Rivera", "bank", "HDFC ****4821", 418_400, "2026-08-21", "pending"],
  ["po-02", "Bianca Cho", "upi", "bia***@okicici", 96_250, "2026-08-22", "pending"],
  ["po-03", "Caleb Wright", "bank", "Chase ****7203", 289_100, "2026-08-20", "processing"],
  ["po-04", "Dana Okafor", "upi", "dan***@okaxis", 152_000, "2026-08-19", "pending"],
  ["po-05", "Elias Novak", "bank", "Deutsche ****3391", 88_450, "2026-08-23", "pending"],
  ["po-06", "Farah Aziz", "upi", "far***@paytm", 61_300, "2026-08-15", "paid"],
  ["po-07", "Hana Kim", "bank", "Woori ****6610", 612_800, "2026-08-14", "paid"],
  ["po-08", "Ishaan Verma", "upi", "ish***@gpay", 74_900, "2026-08-23", "pending"],
];

export const adminPayoutsSeed: AdminPayout[] = payoutRows.map(
  ([id, creatorName, method, paymentDetail, amountMinor, requestedAt, status]) => ({
    id,
    creatorName,
    method,
    paymentDetail,
    amountMinor,
    requestedAt: new Date(`${requestedAt}T09:00:00Z`).toISOString(),
    status,
  })
);

const MONTH_LABELS = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];

const gmvMonthlyMinor = [
  402_000_000, 431_000_000, 455_000_000, 441_000_000, 487_000_000, 512_000_000,
  498_000_000, 536_000_000, 562_000_000, 581_000_000, 604_000_000, 620_000_000,
];

export const adminGmvSeriesSeed: TimeSeriesPoint[] = gmvMonthlyMinor.map((value, i) => ({
  label: MONTH_LABELS[i],
  value,
}));
