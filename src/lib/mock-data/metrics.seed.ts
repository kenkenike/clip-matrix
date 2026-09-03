import type { NetworkMetrics, GeoEntry, PlatformSplitEntry } from "@/lib/services/types";

export const networkMetricsSeed: NetworkMetrics = {
  creatorEarningsMinor: 4_800_000_000,
  creators: 52_000,
  campaigns: 1_200,
  viewsTracked: 9_400_000_000,
  avgEngagementPct: 7.2,
};

export const platformSplitSeed: PlatformSplitEntry[] = [
  { platform: "tiktok", pct: 42 },
  { platform: "instagram", pct: 31 },
  { platform: "youtube", pct: 19 },
  { platform: "x", pct: 8 },
];

export const geoBreakdownSeed: GeoEntry[] = [
  { country: "United States", pct: 38 },
  { country: "United Kingdom", pct: 12 },
  { country: "Germany", pct: 9 },
  { country: "Canada", pct: 7 },
  { country: "Australia", pct: 5 },
];
