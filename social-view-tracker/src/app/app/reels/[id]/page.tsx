"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Flag,
  Heart,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/client-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/toaster";
import { formatCompact, formatDateTime, formatNumber, timeAgo } from "@/lib/format";

type HistoryPoint = { checkedAt: string; viewCount: number | null; source: string | null; eventType: string; flagged: boolean; views: number | null };
type ReelDetail = {
  id: string;
  instagramReelId: string;
  instagramUrl: string;
  normalizedUrl: string;
  username: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  currentViews: number;
  initialViews: number | null;
  viewsGained: number;
  growthPercent: number | null;
  trackingStatus: string;
  lastCheckedAt: string | null;
  lastError: string | null;
  lastSource: string | null;
  flaggedForReview: boolean;
  createdAt: string;
  totalTrackingDurationMs: number;
  peakGrowthPeriod: { date: string; gained: number } | null;
  perDay: Array<{ date: string; gained: number }>;
  perHour: Array<{ hour: string; gained: number }>;
  history: HistoryPoint[];
  isAdmin?: boolean;
};
type ReelEvent = { id: string; kind: string; message: string; meta: string | null; createdAt: string };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  deleted: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  pending_connection: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  pending_media_resolution: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  metric_unavailable: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  completed: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

function durationLabel(ms: number): string {
  if (ms <= 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

const EVENT_KIND_STYLES: Record<string, string> = {
  refresh: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  created: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
  flag: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  status_change: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export default function ReelDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { toast } = useToast();
  const [reel, setReel] = useState<ReelDetail | null>(null);
  const [events, setEvents] = useState<ReelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [detail, eventsRes] = await Promise.all([
        apiFetch<ReelDetail>(`/api/reels/${id}`),
        apiFetch<{ events: ReelEvent[] }>(`/api/reels/${id}?section=events`),
      ]);
      setReel(detail);
      setEvents(eventsRes.events);
    } catch (err) {
      toast({ kind: "error", title: "Could not load reel", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (!id) return;
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [id, load]);

  async function runAction(action: "refresh" | "pause" | "resume" | "delete") {
    setBusy(true);
    try {
      await apiFetch(`/api/reels/${id}/${action}`, { method: "POST" });
      toast({ kind: "success", title: `${action[0].toUpperCase()}${action.slice(1)} successful` });
      await load();
    } catch (err) {
      toast({ kind: "error", title: "Action failed", description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading reel…</p>;
  }
  if (!reel) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Reel not found.</p>;
  }

  const chartData = reel.history
    .map((h) => ({
      time: new Date(h.checkedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      views: h.views,
    }))
    .filter((d): d is { time: string; views: number } => d.views !== null);

  return (
    <div>
      <Link href="/app/reels" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Reels dashboard
      </Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {reel.username ?? "Instagram reel"}
            </h1>
            <Badge className={STATUS_STYLES[reel.trackingStatus] ?? ""}>{reel.trackingStatus}</Badge>
            {reel.flaggedForReview ? (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flag className="mr-1 h-3 w-3" /> Flagged for review
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            @{reel.instagramReelId} · <span className="font-mono text-xs">{reel.instagramReelId}</span>
            {reel.thumbnailUrl ? null : " · source: " + (reel.lastSource ?? "none")}
          </p>
          {reel.caption ? (
            <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{reel.caption}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void runAction("refresh")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh now
          </Button>
          {reel.trackingStatus === "active" ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void runAction("pause")}>
              <Pause className="h-4 w-4" /> Pause
            </Button>
          ) : reel.trackingStatus === "paused" ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void runAction("resume")}>
              <Play className="h-4 w-4" /> Resume
            </Button>
          ) : null}
          {reel.isAdmin ? (
            <Button variant="destructive" size="sm" disabled={busy} onClick={() => void runAction("delete")}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : null}
        </div>
      </div>

      {reel.lastError ? (
        <div className="mt-3 rounded bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {reel.lastError}
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat title="Current views" value={formatNumber(reel.currentViews)} icon={<Eye className="h-4 w-4" />} />
        <Stat title="Initial views" value={reel.initialViews === null ? "—" : formatNumber(reel.initialViews)} icon={<Trophy className="h-4 w-4" />} />
        <Stat title="Views gained" value={`+${formatNumber(reel.viewsGained)}`} icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-600 dark:text-emerald-400" />
        <Stat title="Growth" value={reel.growthPercent === null ? "—" : `+${reel.growthPercent}%`} icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-600 dark:text-emerald-400" />
        <Stat title="Last checked" value={reel.lastCheckedAt ? timeAgo(reel.lastCheckedAt) : "never"} icon={<RefreshCw className="h-4 w-4" />} />
        <Stat title="Tracking duration" value={durationLabel(reel.totalTrackingDurationMs)} icon={<Heart className="h-4 w-4" />} />
      </div>

      {/* Chart */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Views over time</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCompact(v)} width={70} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value)), "Views"]}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--primary, #6366f1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {chartData.length === 1
                ? "First snapshot recorded — check back after the next refresh for a curve."
                : "No view history yet."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Per-day gains */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Views gained per day</CardTitle>
          </CardHeader>
          <CardContent>
            {reel.perDay.length > 0 ? (
              <div className="space-y-1.5">
                {reel.perDay.slice(-14).map((d) => (
                  <div key={d.date} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{d.date}</span>
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCompact(d.gained)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No gains recorded yet.</p>
            )}
            {reel.peakGrowthPeriod ? (
              <div className="mt-3 rounded bg-primary/10 px-3 py-2 text-xs">
                Peak growth period: <span className="font-semibold">{reel.peakGrowthPeriod.date}</span> —{" "}
                +{formatCompact(reel.peakGrowthPeriod.gained)} views
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Event log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-primary" /> Tracking log
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-2 overflow-y-auto">
            {events.map((e) => (
              <div key={e.id} className="rounded border px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <Badge className={EVENT_KIND_STYLES[e.kind] ?? ""}>{e.kind}</Badge>
                  <span className="text-muted-foreground">{timeAgo(e.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.message}</p>
              </div>
            ))}
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No log entries yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* History table */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">View history</CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Checked</th>
                <th className="pb-2 pr-3 font-medium">Views</th>
                <th className="pb-2 pr-3 font-medium">Delta</th>
                <th className="pb-2 pr-3 font-medium">Source</th>
                <th className="pb-2 font-medium">Event</th>
              </tr>
            </thead>
            <tbody>
              {[...reel.history].reverse().map((h, i) => {
                const prevPoint = reel.history[reel.history.length - 1 - i + 1];
                const delta =
                  prevPoint && h.views !== null && prevPoint.views !== null
                    ? h.views - prevPoint.views
                    : null;
                return (
                  <tr key={`${h.checkedAt}-${i}`} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDateTime(h.checkedAt)}</td>
                    <td className="py-2 pr-3 font-semibold tabular-nums">
                      {h.views === null ? (
                        <span className="text-muted-foreground">unavailable</span>
                      ) : (
                        formatNumber(h.views)
                      )}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {delta === null || delta === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : delta > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">+{formatCompact(delta)}</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">{formatCompact(delta)}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{h.source ?? "—"}{h.flagged ? " ⚑" : ""}</td>
                    <td className="py-2 text-xs text-muted-foreground">{h.eventType}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <span className={"text-muted-foreground " + (accent ?? "")}>{icon}</span>
        </div>
        <p className={"mt-1 truncate text-2xl font-bold tabular-nums " + (accent ?? "")}>{value}</p>
      </CardContent>
    </Card>
  );
}