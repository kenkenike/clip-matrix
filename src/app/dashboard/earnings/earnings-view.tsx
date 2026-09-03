"use client";

import { useState } from "react";
import type { AnalyticsRange, Balances, EarningsEntry } from "@/lib/services/types";
import { paymentService, analyticsService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card, ChartCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { MetricCard } from "@/components/ui/metric-card";
import { SkeletonCard, SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EarningsAreaChart } from "@/components/charts/charts";
import { formatCurrency, formatCompact, formatDateShort } from "@/lib/format";

const ranges: AnalyticsRange[] = ["7D", "30D", "90D", "ALL"];

export function EarningsView() {
  const [range, setRange] = useState<AnalyticsRange>("30D");

  const balances = useAsync<Balances>(() => paymentService.getBalances(), []);
  const earnings = useAsync<EarningsEntry[]>(() => paymentService.listEarnings(), []);
  const series = useAsync(() => analyticsService.getCreatorEarningsSeries(range), [range]);

  if (balances.loading || earnings.loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <SkeletonCard className="h-80" />
          <SkeletonTable rows={6} cols={4} />
        </div>
      </div>
    );
  }

  if (balances.error || !balances.data || earnings.error || !earnings.data) {
    return (
      <ErrorState
        message={(balances.error ?? earnings.error) ?? "Something went wrong."}
        onRetry={() => {
          balances.retry();
          earnings.retry();
        }}
      />
    );
  }

  const b = balances.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Earnings</h1>
        <p className="mt-1.5 text-sm text-muted">
          Next automatic payout: <span className="text-fg">{formatDateShort(b.nextPayoutDate)}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Available" value={formatCurrency(b.availableMinor)} countUp={false} delta="ready for payout" deltaPositive />
        <MetricCard label="Pending" value={formatCurrency(b.pendingMinor)} countUp={false} sub="awaiting verification" />
        <MetricCard label="Lifetime" value={formatCurrency(b.lifetimeMinor)} countUp={false} />
        <MetricCard label="This Month" value={formatCurrency(b.thisMonthMinor)} countUp={false} delta="+12.4%" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <ChartCard title="Earnings over time" subtitle={range === "ALL" ? "All time" : `Last ${range.toLowerCase()}`}>
          <Tabs
            variant="pill"
            tabs={ranges.map((r) => ({ id: r, label: r }))}
            active={range}
            onChange={(id) => setRange(id as AnalyticsRange)}
            className="mb-4"
          />
          {series.loading ? (
            <SkeletonCard className="h-64" />
          ) : series.error ? (
            <ErrorState message={series.error} onRetry={series.retry} />
          ) : (
            <EarningsAreaChart data={(series.data ?? []).map((p) => ({ label: p.label, value: p.value / 100 }))} />
          )}
        </ChartCard>

        <Card className="overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
            Transaction history
          </h2>
          <div className="max-h-105 divide-y divide-line overflow-y-auto">
            {earnings.data.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{entry.campaignName}</p>
                  <p className="text-xs text-muted">
                    {formatDateShort(entry.date)} · {formatCompact(entry.views)} views ·{" "}
                    {entry.method.toUpperCase()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
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
