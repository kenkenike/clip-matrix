import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Heart, MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getContent, getContentHistory } from "@/lib/services/content";
import { formatCompact, formatDateTime, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { EngagementChart } from "@/components/charts";
import { PlatformBadge } from "@/components/platform-badge";
import { StatusBadge } from "@/components/status-badge";
import { ContentDetailActions } from "@/components/content-detail-actions";
import { KIND_NAMES } from "@/lib/ui-constants";

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return null;
  const { id } = await params;

  const [content, history] = await Promise.all([
    getContent(user.id, id),
    getContentHistory(user.id, id),
  ]);
  if (!content || !history) notFound();

  const series = history.snapshots.map((s) => ({
    date: formatDate(s.capturedAt),
    views: Number(s.views ?? 0),
    likes: Number(s.likes ?? 0),
    comments: Number(s.comments ?? 0),
  }));

  const accuracy =
    series.length > 1
      ? Math.round((series[series.length - 1].views - series[0].views) / Math.max(1, series[0].views) * 100)
      : null;

  return (
    <div className="space-y-6">
      <Link href="/app/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to content
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">{content.title ?? "Untitled"}</h2>
            <PlatformBadge platform={content.platform} />
            <StatusBadge status={content.status} />
            {content.source ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {content.source === "WEB" ? "public page" : "official API"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {KIND_NAMES[content.kind] ?? content.kind}
            {content.accountName ? ` · ${content.accountName}` : ""}
            {content.publishedAt ? ` · Published ${formatDateTime(content.publishedAt)}` : ""}
          </p>
          <a href={content.url} target="_blank" rel="noreferrer" className="mt-1 inline-block max-w-[90vw] truncate text-xs text-primary hover:underline">
            {content.url}
          </a>
          {content.caption ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{content.caption}</p>
          ) : null}
        </div>
        <ContentDetailActions id={content.id} />
      </div>

      {content.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.thumbnailUrl} alt="" className="h-48 w-full rounded-lg border object-cover sm:w-80" />
      ) : null}

      {content.lastError ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          {content.lastError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Views" value={formatCompact(content.views)} sub={content.viewsGained != null ? `${formatCompact(content.viewsGained)} gained since last check` : "No change yet"} icon={Eye} />
        <MetricCard label="Likes" value={formatCompact(content.likes)} icon={Heart} accent="muted" />
        <MetricCard label="Comments" value={formatCompact(content.comments)} icon={MessageSquare} accent="muted" />
        <MetricCard label="Growth" value={content.growthPct != null ? formatPercent(content.growthPct) : "—"} sub={history.snapshots.length > 1 ? `${history.snapshots.length} snapshots kept` : "History builds over time"} accent={accuracy != null && accuracy > 0 ? "primary" : "muted"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot history</CardTitle>
          <CardDescription>Every successful check since this item was added.</CardDescription>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <div className="flex h-60 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No snapshots yet. Hit “Re-check now” to collect the first snapshot.
            </div>
          ) : (
            <EngagementChart data={series} height={300} />
          )}
        </CardContent>
      </Card>

      {history.snapshots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Collected snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Captured at</th>
                    <th className="py-2 pr-3 text-right">Views</th>
                    <th className="py-2 pr-3 text-right">Likes</th>
                    <th className="py-2 text-right">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {history.snapshots.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono-nums">{formatDateTime(s.capturedAt)}</td>
                      <td className="py-2 pr-3 text-right font-mono-nums">{s.views === null ? "—" : formatNumber(s.views)}</td>
                      <td className="py-2 pr-3 text-right font-mono-nums">{s.likes === null ? "—" : formatNumber(s.likes)}</td>
                      <td className="py-2 text-right font-mono-nums">{s.comments === null ? "—" : formatNumber(s.comments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}