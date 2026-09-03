import type { AnalyticsRange } from "@/lib/services/types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 24 * 60 * 60 * 1000;
const ANCHOR = new Date("2026-08-25T12:00:00Z").getTime();

export function generateSeries(
  points: number,
  base: number,
  amplitude: number,
  growth: number,
  seed: number,
  labelStyle: "date" | "compact" = "date"
): { label: string; value: number; iso: string }[] {
  const rand = mulberry32(seed);
  const out: { label: string; value: number; iso: string }[] = [];
  for (let i = 0; i < points; i++) {
    const date = new Date(ANCHOR - (points - 1 - i) * DAY);
    const trend = base * (1 + growth * i);
    const noise = trend * amplitude * (rand() * 2 - 1);
    const weekly = i % 7 >= 5 ? 0.82 : 1.06;
    const value = Math.max(base * 0.35, Math.round(trend * weekly + noise));
    out.push({
      iso: date.toISOString(),
      label:
        labelStyle === "date"
          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `${date.getDate()}`,
      value,
    });
  }
  return out;
}

const rangeConfig: Record<AnalyticsRange, { days: number }> = {
  "7D": { days: 7 },
  "30D": { days: 30 },
  "90D": { days: 90 },
  ALL: { days: 365 },
};

export function seriesForRanges(
  config: Record<AnalyticsRange, { base: number; amplitude: number; growth: number; seed: number }>,
  labelStyle: "date" | "compact" = "date"
): Record<AnalyticsRange, { label: string; value: number; iso: string }[]> {
  return {
    "7D": generateSeries(rangeConfig["7D"].days, config["7D"].base, config["7D"].amplitude, config["7D"].growth, config["7D"].seed, labelStyle),
    "30D": generateSeries(rangeConfig["30D"].days, config["30D"].base, config["30D"].amplitude, config["30D"].growth, config["30D"].seed, labelStyle),
    "90D": generateSeries(rangeConfig["90D"].days, config["90D"].base, config["90D"].amplitude, config["90D"].growth, config["90D"].seed, labelStyle),
    ALL: generateSeries(
      rangeConfig.ALL.days,
      config.ALL.base,
      config.ALL.amplitude,
      config.ALL.growth,
      config.ALL.seed,
      labelStyle
    ),
  };
}
