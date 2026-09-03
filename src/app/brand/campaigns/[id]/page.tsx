import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Users,
  Eye,
  Percent,
  Pause,
  Pencil,
  TrendingUp,
  Download,
} from "lucide-react";
import { campaignService, brandService } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { PlatformBadges } from "@/components/ui/platform";
import { ProgressBar } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";
import { SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { EarningsAreaChart, MiniAreaChart } from "@/components/charts/charts";
import { formatCurrency, formatCompact, formatDateShort } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await brandService.getCampaignDetail(id);
  if (!campaign) return { title: "Campaign Not Found" };
  return { title: `${campaign.name} - Brand`, description: campaign.description };
}

const leaderboardFallback = [
  { rank: 1, displayName: "CreatorA", views: 8_400_000 },
];

export default async function BrandCampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const [campaign, overview] = await Promise.all([
    brandService.getCampaignDetail(id),
    brandService.getOverview().catch(() => null),
  ]);
  if (!campaign) notFound();

  const budgetPct = Math.min(
    100,
    Math.round((campaign.spentMinor / Math.max(campaign.budgetMinor, 1)) * 100)
  );
  const topCreators = overview?.topCreators ?? leaderboardFallback.map((c) => ({
    rank: c.rank,
    creatorId: String(c.rank),
    displayName: c.displayName,
    handle: `@${c.displayName.toLowerCase()}`,
    views: c.views,
    engagementRate: 0,
    clipsCount: 0,
    earnedMinor: 0,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <InitialTile label={campaign.brandInitial} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-fg">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Ends in {campaign.daysRemaining} days
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {campaign.creatorCount.toLocaleString()} creators
                </span>
                <span className="font-semibold text-accent tabular-nums">
                  {formatCurrency(campaign.ratePer100kMinor)} / 100K
                </span>
              </div>
              <div className="mt-4">
                <PlatformBadges platforms={campaign.platforms} />
              </div>
            </div>
          </div>
          <CampaignActions />
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-muted">
              {formatCurrency(campaign.spentMinor)} spent of {formatCurrency(campaign.budgetMinor)}
            </span>
            <span className="tabular-nums text-faint">{budgetPct}%</span>
          </div>
          <ProgressBar value={budgetPct} max={100} className="mt-2" />
          <p className="mt-2 text-xs text-faint">
            {formatCompact(Math.max(0, (campaign.budgetMinor - campaign.spentMinor) / 100))} USD remaining
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Total Views" value={campaign.totalViews} compact countUp icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clips Published" value={campaign.totalClips} countUp />
        <MetricCard label="Engagement Rate" value={campaign.engagementRate} suffix="%" countUp icon={<Percent className="h-4 w-4" />} />
        <MetricCard label="Effective CPM" value={`$${(campaign.cpmMinor / 100).toFixed(2)}`} countUp={false} sub="per 1K verified views" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <ChartCardLite
            title="Views over time"
            data={campaign.performanceSeries}
          />

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
              Recent submissions
            </h2>
            <ul className="divide-y divide-line">
              {(overview?.recentSubmissions ?? []).slice(0, 6).map((clip) => (
                <li key={clip.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-fg">{clip.creatorName}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {formatCompact(clip.views)} views · {formatDateShort(clip.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge status={clip.status} />
                </li>
              ))}
              {(overview?.recentSubmissions ?? []).length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-muted">
                  No submissions yet - creators are discovering this brief now.
                </li>
              )}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
              Spend history
            </h2>
            <div className="px-5 py-4">
              <MiniAreaChart data={campaign.spendHistory.map((s) => ({ label: s.month, value: s.amountMinor / 100 }))} />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold text-fg">Leaderboard</h2>
            <ol className="mt-4 space-y-3">
              {topCreators.slice(0, 5).map((c) => (
                <li key={`${c.creatorId}-${c.rank}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="w-7 shrink-0 font-heading text-lg font-extrabold text-accent">#{c.rank}</span>
                    <span>
                      <span className="block font-medium text-fg">{c.displayName}</span>
                      <span className="text-xs text-muted">{c.handle}</span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted">{formatCompact(c.views)}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold text-fg">Platform breakdown</h2>
            <ul className="mt-4 space-y-3">
              {(overview?.platformSplit ?? []).map((entry) => (
                <li key={entry.platform}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted capitalize">{entry.platform}</span>
                    <span className="tabular-nums text-faint">{entry.pct}%</span>
                  </div>
                  <ProgressBar value={entry.pct} max={100} className="mt-1.5 h-1.5" />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-base font-semibold text-fg">Top geographies</h2>
            <ul className="mt-4 space-y-3">
              {campaign.geoBreakdown.slice(0, 5).map((geo) => (
                <li key={geo.country}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">{geo.country}</span>
                    <span className="tabular-nums text-faint">{geo.pct}%</span>
                  </div>
                  <ProgressBar value={geo.pct} max={100} className="mt-1.5 h-1.5" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChartCardLite({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
  return (
    <Card className="p-5">
      <h2 className="font-heading text-base font-semibold text-fg">{title}</h2>
      <div className="mt-4">
        <EarningsAreaChart data={data} height={260} />
      </div>
    </Card>
  );
}

function CampaignActions() {
  const actions = [
    { label: "Pause", icon: Pause, variant: "secondary" as const },
    { label: "Edit", icon: Pencil, variant: "secondary" as const },
    { label: "Increase Budget", icon: TrendingUp, variant: "primary" as const },
    { label: "Export Data", icon: Download, variant: "ghost" as const },
  ];
  void Button;
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:w-auto sm:flex lg:grid lg:w-56">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className={
            a.variant === "primary"
              ? "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110"
              : "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-white/5"
          }
        >
          <a.icon className="h-4 w-4" aria-hidden="true" />
          {a.label}
        </button>
      ))}
    </div>
  );
}
