import { sleep } from "@/lib/utils";
import { seriesForRanges } from "@/lib/mock-data/series.seed";
import { geoBreakdownSeed, networkMetricsSeed, platformSplitSeed } from "@/lib/mock-data/metrics.seed";
import type {
  AnalyticsRange,
  AnalyticsService,
  BrandChartMetric,
  GeoEntry,
  NetworkMetrics,
  PlatformSplitEntry,
  TimeSeriesPoint,
} from "@/lib/services/types";

const LATENCY = 300;

export class MockAnalyticsService implements AnalyticsService {
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    await sleep(LATENCY);
    return { ...networkMetricsSeed };
  }

  async getCreatorEarningsSeries(range: AnalyticsRange): Promise<TimeSeriesPoint[]> {
    await sleep(250);
    const all = seriesForRanges({
      "7D": { base: 4_800, amplitude: 0.35, growth: 0.05, seed: 11 },
      "30D": { base: 3_900, amplitude: 0.45, growth: 0.03, seed: 12 },
      "90D": { base: 2_800, amplitude: 0.5, growth: 0.02, seed: 13 },
      ALL: { base: 900, amplitude: 0.6, growth: 0.008, seed: 14 },
    }, "compact");
    return all[range];
  }

  async getBrandTimeSeries(
    metric: BrandChartMetric,
    range: AnalyticsRange
  ): Promise<TimeSeriesPoint[]> {
    await sleep(250);
    const cfg = {
      views: { base: 380_000, amplitude: 0.4, growth: 0.03, seed: 21 },
      engagement: { base: 6_400, amplitude: 0.2, growth: 0.01, seed: 22 },
      spend: { base: 48_000, amplitude: 0.45, growth: 0.04, seed: 23 },
      creators: { base: 120, amplitude: 0.35, growth: 0.05, seed: 24 },
    }[metric];
    const all = seriesForRanges({
      "7D": { ...cfg },
      "30D": { ...cfg },
      "90D": { ...cfg },
      ALL: { ...cfg },
    }, "compact");
    return all[range].map((p) => ({
      label: p.label,
      value:
        metric === "engagement"
          ? Math.round((p.value / 1_000) * 10) / 10
          : p.value,
    }));
  }

  async getPlatformSplit(): Promise<PlatformSplitEntry[]> {
    await sleep(200);
    return platformSplitSeed.map((p) => ({ ...p }));
  }

  async getGeoBreakdown(): Promise<GeoEntry[]> {
    await sleep(200);
    return geoBreakdownSeed.map((g) => ({ ...g }));
  }

  async getCampaignPerformance(range: AnalyticsRange): Promise<TimeSeriesPoint[]> {
    await sleep(250);
    return seriesForRanges({
      "7D": { base: 1_400_000, amplitude: 0.25, growth: 0.04, seed: 31 },
      "30D": { base: 1_100_000, amplitude: 0.35, growth: 0.02, seed: 32 },
      "90D": { base: 800_000, amplitude: 0.4, growth: 0.015, seed: 33 },
      ALL: { base: 300_000, amplitude: 0.55, growth: 0.008, seed: 34 },
    }, "compact")[range];
  }
}
