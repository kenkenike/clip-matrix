import Link from "next/link";
import { ArrowRight, Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOverview, getProjectionSeries } from "@/lib/services/analytics";
import { getUsage } from "@/lib/services/usage";
import { formatCompact, formatPercent } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { StatusPieChart, EngagementChart } from "@/components/charts";
import { PlatformBadge } from "@/components/platform-badge";
import { STATUS_COLORS, STATUS_NAMES } from "@/lib/ui-constants";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const [overview, usage, series] = await Promise.all([
    getOverview(user.id),
    getUsage(user.id),
    getProjectionSeries(user.id, last30Days()),
  ]);

  const pieData = Object.entries(overview.statusBreakdown).map(([status, count]) => ({
    name: STATUS_NAMES[status as keyof typeof STATUS_NAMES] ?? status,
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#64748b",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {overview.totalContent} tracked {overview.totalContent === 1 ? "item" : "items"} · {usage.usage.checksToday} checks today ·{" "}
            {formatCompact(usage.usage.checksToday)} of your plan
          </p>
        </div>
        <ButtonLink href="/app/add">
          Add content <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total views" value={formatCompact(overview.totalViews)} sub={`Across ${overview.totalContent} items`} icon={Eye} />
        <MetricCard label="Views today" value={formatCompact(overview.viewsGainedToday)} sub="Gained since midnight" icon={TrendingUp} accent="warning" />
        <MetricCard label="Total likes" value={formatCompact(overview.totalLikes)} icon={Heart} accent="muted" />
        <MetricCard label="Total comments" value={formatCompact(overview.totalComments)} icon={MessageSquare} accent="muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement over time</CardTitle>
            <CardDescription>Views, likes, and comments across all tracked content (last 30 days).</CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>Where each tracked item stands.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={pieData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fastest growing</CardTitle>
            <CardDescription>By view growth between the last two snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.fastestGrowing ? (
              <ContentSpotlight
                hit={{
                  ...overview.fastestGrowing,
                  valueLabel: `${formatPercent(overview.fastestGrowing.growthPct)} growth`,
                  valueNote: `${formatCompact(overview.fastestGrowing.views)} views`,
                }}
                href={`/app/content/${overview.fastestGrowing.id}`}
              />
            ) : (
              <EmptySpotlight href="/app/add" showAdd />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Highest viewed</CardTitle>
            <CardDescription>Your most-watched tracked item.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.highestViewed ? (
              <ContentSpotlight
                hit={{
                  ...overview.highestViewed,
                  valueLabel: `${formatCompact(overview.highestViewed.views)} views`,
                  valueNote: "",
                }}
                href={`/app/content/${overview.highestViewed.id}`}
              />
            ) : (
              <EmptySpotlight href="/app/add" showAdd />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContentSpotlight({
  hit,
  href,
}: {
  hit: {
    title: string;
    url: string;
    platform: string;
    views: number;
    thumbnailUrl: string | null;
    valueLabel: string;
    valueNote: string;
  };
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      {hit.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hit.thumbnailUrl}
          alt=""
          className="h-16 w-24 rounded-md border object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          No preview
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium group-hover:text-primary">{hit.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <PlatformBadge platform={hit.platform as "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "X"} />
          <span className="font-mono-nums">{hit.valueLabel}</span>
          {hit.valueNote ? <span className="font-mono-nums">{hit.valueNote}</span> : null}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function EmptySpotlight({ href, showAdd }: { href: string; showAdd: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
      <p>Not enough snapshot data yet. Add content and let the worker collect a couple of checks.</p>
      {showAdd ? (
        <ButtonLink href={href} variant="outline" size="sm">
          Track your first URL
        </ButtonLink>
      ) : null}
    </div>
  );
}

function last30Days() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to, granularity: "daily" as const };
}