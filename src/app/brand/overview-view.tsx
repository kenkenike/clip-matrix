"use client";

import { Megaphone, Eye, Users, Percent, DollarSign } from "lucide-react";
import type { BrandOverview as BrandOverviewData } from "@/lib/services/types";
import { brandService, creatorService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, ChartCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PlatformIcon, platformLabel } from "@/components/ui/platform";
import { SkeletonCard, SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { PerformanceBarChart } from "@/components/charts/charts";
import { formatCurrency, formatCompact } from "@/lib/format";

export function BrandOverviewView() {
  const overview = useAsync<BrandOverviewData>(() => brandService.getOverview(), []);
  const brand = useAsync(() => brandService.getBrand(), []);

  if (overview.loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <SkeletonCard className="h-80" />
          <SkeletonTable rows={5} cols={3} />
        </div>
      </div>
    );
  }

  if (overview.error || !overview.data) {
    return <ErrorState message={overview.error ?? "Something went wrong."} onRetry={overview.retry} />;
  }

  const d = overview.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-faint uppercase">Brand workspace</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {brand.data?.name ?? d.brandName}
          </h1>
        </div>
        <ButtonLink href="/contact" size="lg">
          Launch Campaign
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Active Campaigns" value={d.metrics.activeCampaigns} countUp icon={<Megaphone className="h-4 w-4" />} />
        <MetricCard label="Total Spend" value={formatCurrency(d.metrics.totalSpendMinor)} countUp={false} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Total Views" value={d.metrics.totalViews} compact countUp icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Creators Reached" value={d.metrics.creators} compact countUp icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Engagement Rate" value={d.metrics.engagementRate} suffix="%" countUp icon={<Percent className="h-4 w-4" />} delta="+0.8 pts vs last month" />
        <MetricCard label="Avg CPM" value={`$${(d.metrics.avgCpmMinor / 100).toFixed(2)}`} countUp={false} sub="per 1K verified views" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <ChartCard title="Campaign performance" subtitle="Weekly views across all campaigns">
          <PerformanceBarChart
            data={d.campaignPerformance.map((p) => ({ label: p.label, value: p.value }))}
          />
        </ChartCard>

        <ChartCard title="Platform mix" subtitle="Share of verified views">
          <ul className="space-y-4 pt-2">
            {d.platformSplit.map((entry) => (
              <li key={entry.platform}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <PlatformIcon platform={entry.platform} className="h-4 w-4" />
                    {platformLabel(entry.platform)}
                  </span>
                  <span className="font-medium tabular-nums text-fg">{entry.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${entry.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs font-semibold tracking-wider text-faint uppercase">Top creators</p>
            <ul className="mt-3 space-y-2.5">
              {d.topCreators.slice(0, 3).map((c) => (
                <li key={c.creatorId} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    <span className="mr-2 font-heading font-bold text-accent">#{c.rank}</span>
                    {c.displayName}
                  </span>
                  <span className="tabular-nums text-faint">{formatCompact(c.views)} views</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      <Card className="overflow-hidden">
        <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
          Recent submissions
        </h2>
        <div className="divide-y divide-line">
          {d.recentSubmissions.map((clip) => (
            <div key={clip.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <PlatformIcon platform={clip.platform} className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{clip.campaignName}</p>
                  <p className="text-xs text-muted">
                    {clip.creatorName} · {formatCompact(clip.views)} views
                  </p>
                </div>
              </div>
              <StatusBadge status={clip.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
