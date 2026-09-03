"use client";

import { useState } from "react";
import { SectionHeading, Section } from "@/components/marketing/section";
import { Tabs } from "@/components/ui/tabs";
import { MetricLineChart, PerformanceBarChart, type ChartPoint } from "@/components/charts/charts";
import { analyticsService, brandService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { formatCompact } from "@/lib/format";
import { PlatformIcon } from "@/components/ui/platform";
import { ErrorState } from "@/components/ui/skeleton";

type Metric = "views" | "engagement" | "spend" | "creators";

const metricTabs: { id: Metric; label: string }[] = [
  { id: "views", label: "Views" },
  { id: "engagement", label: "Engagement" },
  { id: "spend", label: "Spend" },
  { id: "creators", label: "Creators" },
];

const headlineMetrics = [
  { label: "Total views", value: "12.8M" },
  { label: "Creators", value: "384" },
  { label: "Engagement", value: "6.8%" },
  { label: "Spend", value: "$4,820" },
  { label: "CPM", value: "$0.38" },
];

export function BrandAnalyticsPreview() {
  const [metric, setMetric] = useState<Metric>("views");
  const series = useAsync(() => analyticsService.getBrandTimeSeries(metric, "90D"), [metric]);
  const split = useAsync(() => brandService.getOverview(), []);

  return (
    <Section alt>
      <SectionHeading
        eyebrow="For brands"
        title="Every Dollar Traced to a View."
        copy="Live dashboards show exactly where spend lands: which creators, which platforms, which countries."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-none border border-line bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-base font-semibold">Performance - last 90 days</h3>
            <Tabs
              tabs={metricTabs}
              active={metric}
              onChange={(id) => setMetric(id as Metric)}
            />
          </div>
          {series.loading && (
            <div className="h-[300px] animate-pulse rounded-xl bg-white/[0.05]" />
          )}
          {series.error && <ErrorState message={series.error} onRetry={series.retry} />}
          {series.data &&
            (metric === "views" ? (
              <PerformanceBarChart data={series.data} height={300} />
            ) : (
              <MetricLineChart
                data={series.data}
                height={300}
                valueLabel={metric.charAt(0).toUpperCase() + metric.slice(1)}
                currency={metric === "spend"}
              />
            ))}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-5">
            {headlineMetrics.map((m) => (
              <div key={m.label}>
                <dt className="text-[10px] tracking-wide text-faint uppercase">{m.label}</dt>
                <dd className="mt-1 font-heading text-xl font-bold tabular-nums text-fg">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-5">
          <div className="rounded-none border border-line bg-surface p-5">
            <h3 className="mb-4 font-heading text-base font-semibold">Platform distribution</h3>
            {split.data ? (
              <ul className="space-y-3.5">
                {split.data.platformSplit.map((entry) => (
                  <li key={entry.platform} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-alt">
                      <PlatformIcon platform={entry.platform} className="h-3.5 w-3.5 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-fg capitalize">{entry.platform}</span>
                        <span className="tabular-nums text-muted">{entry.pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${entry.pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-40 animate-pulse rounded-xl bg-white/[0.05]" />
            )}
          </div>

          <GeoBars />
        </div>
      </div>
    </Section>
  );
}

function GeoBars() {
  const geo = useAsync(() => analyticsService.getGeoBreakdown(), []);
  return (
    <div className="rounded-none border border-line bg-surface p-5">
      <h3 className="mb-4 font-heading text-base font-semibold">Top countries</h3>
      {geo.loading && <div className="h-40 animate-pulse rounded-xl bg-white/[0.05]" />}
      {geo.error && <ErrorState message={geo.error} onRetry={geo.retry} />}
      {geo.data && (
        <ul className="space-y-3.5">
          {geo.data.map((entry) => (
            <li key={entry.country}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-fg">{entry.country}</span>
                <span className="tabular-nums text-muted">{entry.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${entry.pct * 2}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function formatCompactValue(v: number): string {
  return formatCompact(v);
}
