"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-fetch";
import { formatCompact } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EngagementChart, type SeriesDatum } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toaster";

type Summary = {
  totalContent: number;
  totalViews: number;
  averageViews: number;
  viewsGainedToday: number;
  totalLikes: number;
  totalComments: number;
};

type SeriesResponse = {
  range: { from: string; to: string };
  granularity: "daily" | "weekly";
  series: SeriesDatum[];
  growth: SeriesDatum[];
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [days, setDays] = useState("30");
  const [granularity, setGranularity] = useState<"daily" | "weekly">("daily");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [summaryRes, seriesRes] = await Promise.all([
          apiFetch<Summary>("/api/analytics/summary"),
          apiFetch<SeriesResponse>(`/api/analytics/series?days=${days}&granularity=${granularity}`),
        ]);
        if (cancelled) return;
        setSummary(summaryRes);
        setSeries(seriesRes);
      } catch (err) {
        if (!cancelled) toast({ kind: "error", title: "Could not load analytics", description: (err as Error).message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [days, granularity, toast]);

  const recentGrowth = series?.growth?.[series.growth.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Aggregate engagement across everything you track."
        actions={
          <div className="flex items-center gap-2">
            <Select value={granularity} onChange={(e) => setGranularity(e.target.value as "daily" | "weekly")} aria-label="Granularity" className="w-32">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Time range" className="w-32">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </Select>
          </div>
        }
      />

      {loading && !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total views" value={formatCompact(summary?.totalViews)} sub={`${summary?.totalContent ?? 0} items tracked`} />
          <MetricCard label="Average views" value={formatCompact(summary?.averageViews)} sub="Per tracked item" accent="muted" />
          <MetricCard label="Views today" value={formatCompact(summary?.viewsGainedToday)} sub="Gained since midnight" accent="warning" />
          <MetricCard
            label="Growth this period"
            value={recentGrowth ? formatCompact(recentGrowth.views) : "—"}
            sub={recentGrowth ? `new views vs prior ${days}-day start` : "Awaiting snapshots"}
            accent={recentGrowth && recentGrowth.views > 0 ? "primary" : "muted"}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Engagement series</CardTitle>
          <CardDescription>
            {series?.range ? `${new Date(series.range.from).toLocaleDateString()} → ${new Date(series.range.to).toLocaleDateString()}` : "Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !series ? <Skeleton className="h-72" /> : <EngagementChart data={series?.series ?? []} height={320} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Period gains</CardTitle>
          <CardDescription>Views, likes, and comments gained per period across snapshots.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !series ? <Skeleton className="h-56" /> : <EngagementChart data={series?.growth ?? []} height={240} />}
        </CardContent>
      </Card>
    </div>
  );
}