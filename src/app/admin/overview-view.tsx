"use client";

import { Eye, Users, Building2, Megaphone, Wallet, DollarSign, Clock, Flag } from "lucide-react";
import type { AdminOverview, AdminUserRow, TimeSeriesPoint } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonCard, SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EarningsAreaChart } from "@/components/charts/charts";
import { RoleBadge } from "@/components/admin/role-badge";
import { formatCurrencyCompact, formatDateShort } from "@/lib/format";

export function AdminOverviewView() {
  const overview = useAsync<AdminOverview>(() => adminService.getOverview(), []);
  const series = useAsync<TimeSeriesPoint[]>(() => adminService.getGmvSeries(), []);
  const signups = useAsync<AdminUserRow[]>(() => adminService.listRecentSignups(6), []);

  if (overview.loading) {
    return (
      <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <SkeletonCard className="h-80" />
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    );
  }

  if (overview.error || !overview.data) {
    return <ErrorState message={overview.error ?? "Something went wrong."} onRetry={overview.retry} />;
  }

  const o = overview.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Platform overview
        </h1>
        <p className="mt-1.5 text-sm text-muted">Network health across creators, brands, and revenue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard centered label="Total Users" value={o.totalUsers} countUp icon={<Users className="h-4 w-4" />} delta="+3.1% MoM" />
        <MetricCard centered label="Active Creators" value="52,000+" icon={<Eye className="h-4 w-4" />} sub="submitted in last 30d" />
        <MetricCard centered label="Brands" value={o.brands} countUp icon={<Building2 className="h-4 w-4" />} delta="+18 this week" />
        <MetricCard centered label="Active Campaigns" value={o.activeCampaigns} countUp icon={<Megaphone className="h-4 w-4" />} delta="+6.4% MoM" />
        <MetricCard centered label="Views Tracked" value={o.viewsTracked} compact countUp icon={<Eye className="h-4 w-4" />} delta="+11.8% MoM" />
        <MetricCard centered label="GMV" value={formatCurrencyCompact(o.gmvMinor)} icon={<DollarSign className="h-4 w-4" />} delta="+8.9% MoM" />
        <MetricCard centered label="Platform Revenue" value={formatCurrencyCompact(o.platformRevenueMinor)} icon={<Wallet className="h-4 w-4" />} sub="12% take rate" />
        <MetricCard centered label="Pending Payouts" value={formatCurrencyCompact(o.pendingPayoutsMinor)} icon={<Clock className="h-4 w-4" />} sub="next run Friday" />
        <MetricCard
          centered
          label="Flagged Submissions"
          value={o.flaggedSubmissions}
          countUp
          icon={<Flag className="h-4 w-4" />}
          deltaPositive={false}
          delta="needs review"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
            Platform GMV
          </h2>
          <p className="px-5 pt-4 text-xs text-muted">Gross marketplace volume, trailing 12 months</p>
          <div className="p-5 pt-2">
            {series.loading && <SkeletonCard className="h-64 border-0 bg-transparent" />}
            {series.error && <ErrorState message={series.error} onRetry={series.retry} />}
            {series.data && (
              <EarningsAreaChart data={series.data.map((p) => ({ label: p.label, value: p.value / 100 }))} />
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
            Recent signups
          </h2>
          {signups.loading && <SkeletonTable rows={5} cols={4} />}
          {signups.error && <ErrorState message={signups.error ?? "Something went wrong."} onRetry={signups.retry} />}
          {signups.data && (
            <ul className="divide-y divide-line">
              {signups.data.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">{user.name}</p>
                      <p className="truncate text-xs text-muted">{formatDateShort(user.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
