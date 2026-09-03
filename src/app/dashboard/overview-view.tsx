"use client";

import { useState } from "react";
import { Eye, Wallet, Compass, Clock } from "lucide-react";
import type { AnalyticsRange, CreatorOverview as CreatorOverviewData } from "@/lib/services/types";
import { creatorService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, ChartCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/ui/platform";
import { SkeletonCard, SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { EarningsAreaChart, MiniAreaChart } from "@/components/charts/charts";
import { formatCurrency, formatCompact, formatDateShort, rateLabel } from "@/lib/format";

const ranges: AnalyticsRange[] = ["7D", "30D", "90D", "ALL"];

export function CreatorOverviewView() {
  const [range, setRange] = useState<AnalyticsRange>("30D");
  const { data, loading, error, retry } = useAsync<CreatorOverviewData>(() => creatorService.getOverview(), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
        <SkeletonTable rows={4} cols={5} />
      </div>
    );
  }

  if (error || !data) return <ErrorState message={error ?? "Something went wrong."} onRetry={retry} />;

  const series = data.earningsSeries[range];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Welcome back, {data.displayName.split(" ")[0]}.
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Views" value={data.metrics.totalViews} compact countUp icon={<Eye className="h-4 w-4" />} delta="+8.2% this month" />
        <MetricCard
          label="Total Earnings"
          value={formatCurrency(data.metrics.totalEarningsMinor)}
          countUp={false}
          icon={<Wallet className="h-4 w-4" />}
          delta="+12.4% this month"
        />
        <MetricCard label="Active Campaigns" value={data.metrics.activeCampaigns} icon={<Compass className="h-4 w-4" />} sub="across 4 brands" />
        <MetricCard
          label="Pending Earnings"
          value={formatCurrency(data.metrics.pendingEarningsMinor)}
          countUp={false}
          icon={<Clock className="h-4 w-4" />}
          sub="clears on verification"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Earnings" subtitle={`Last ${range === "ALL" ? "12 months" : range.toLowerCase()}`}>
          <Tabs
            variant="pill"
            tabs={ranges.map((r) => ({ id: r, label: r }))}
            active={range}
            onChange={(id) => setRange(id as AnalyticsRange)}
            className="mb-4"
          />
          <EarningsAreaChart
            data={series.map((p) => ({ label: p.label, value: p.value / 100 }))}
          />
        </ChartCard>

        <Card className="flex flex-col p-5">
          <h2 className="font-heading text-base font-semibold text-fg">Recent clips</h2>
          <ul className="mt-4 flex-1 divide-y divide-line">
            {data.recentClips.slice(0, 5).map((clip) => (
              <li key={clip.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{clip.campaignName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <PlatformIcon platform={clip.platform} className="h-3 w-3" />
                    {formatCompact(clip.views)} views
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={clip.status} />
                  <p className="mt-1 text-xs font-medium tabular-nums text-accent">
                    {rateLabel(clip.earnedMinor)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <ChartCard title="Views trend" subtitle="Rolling weekly views">
          <MiniAreaChart data={data.recentEarnings.map((e) => ({ label: e.date.slice(5), value: e.views }))} />
        </ChartCard>

        <Card className="overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
            Recent earnings
          </h2>
          <div className="divide-y divide-line">
            {data.recentEarnings.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-fg">{entry.campaignName}</p>
                  <p className="text-xs text-muted">
                    {formatDateShort(entry.date)} · {formatCompact(entry.views)} views · {entry.method.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-fg">{formatCurrency(entry.amountMinor)}</p>
                  <StatusBadge status={entry.status.toLowerCase()} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
