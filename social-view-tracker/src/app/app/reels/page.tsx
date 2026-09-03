"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Eye,
  Flag,
  Flame,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toaster";
import { formatCompact, formatNumber, timeAgo } from "@/lib/format";

type Stats = {
  totalReels: number;
  totalViews: number;
  viewsGainedToday: number;
  viewsGainedThisWeek: number;
  viewsGainedThisMonth: number;
  averageViewsPerReel: number;
  activeTracking: number;
  pausedTracking: number;
  failedInvalid: number;
  isAdmin?: boolean;
  topPerformingReel: {
    id: string;
    instagramReelId: string;
    username: string | null;
    thumbnailUrl: string | null;
    currentViews: number;
    viewsGained: number;
  } | null;
};

type ReelRow = {
  id: string;
  instagramReelId: string;
  instagramUrl: string;
  normalizedUrl: string;
  username: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  currentViews: number;
  initialViews: number;
  viewsGained: number;
  trackingStatus: string;
  lastCheckedAt: string | null;
  lastError: string | null;
  lastSource: string | null;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = { reels: ReelRow[]; total: number; page: number; pageSize: number; pages: number };

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

function growth(initial: number | null, current: number): string {
  if (!initial || initial <= 0) return "—";
  return `+${(((current - initial) / initial) * 100).toFixed(1)}%`;
}

export default function ReelsDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [reelUrl, setReelUrl] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ sort, status, page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      const [statsRes, listRes] = await Promise.all([
        apiFetch<Stats>("/api/reels/stats"),
        apiFetch<ListResponse>(`/api/reels?${params.toString()}`),
      ]);
      setStats(statsRes);
      setList(listRes);
    } catch (err) {
      toast({ kind: "error", title: "Could not load reels", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, page, toast]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load(true));
    return () => cancelAnimationFrame(frame);
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!reelUrl.trim()) return;
    setAdding(true);
    try {
      const res = await apiFetch<{ message: string; reel: { id: string } }>("/api/reels", {
        method: "POST",
        body: JSON.stringify({ url: reelUrl }),
      });
      toast({ kind: "success", title: "Reel added successfully", description: res.message });
      setReelUrl("");
      setAddOpen(false);
      await load();
    } catch (err) {
      const msg = (err as Error).message ?? "Could not add reel.";
      toast({ kind: "error", title: "Reel not added", description: msg });
      if (msg.toLowerCase().includes("already")) {
        // Refresh list so the existing reel is visible.
        await load();
      }
    } finally {
      setAdding(false);
    }
  }

  async function runAction(id: string, action: "refresh" | "pause" | "resume" | "delete") {
    setBusyId(id);
    try {
      await apiFetch(`/api/reels/${id}/${action}`, { method: "POST" });
      const label =
        action === "refresh"
          ? "Refreshed"
          : action === "pause"
            ? "Paused"
            : action === "resume"
              ? "Resumed"
              : "Deleted";
      toast({ kind: "success", title: label, description: `${label} successfully.` });
      if (action === "delete") setPage(1);
      await load();
    } catch (err) {
      toast({ kind: "error", title: "Action failed", description: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">CLIP MATRIX</h1>
        <p className="text-sm text-muted-foreground">Creator Performance &amp; View Tracking</p>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Reels" value={formatNumber(stats.totalReels)} icon={<Trophy className="h-4 w-4" />} />
          <StatCard title="Total Views" value={formatCompact(stats.totalViews)} icon={<Eye className="h-4 w-4" />} />
          <StatCard title="Views gained today" value={formatCompact(stats.viewsGainedToday)} icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Views gained this week" value={formatCompact(stats.viewsGainedThisWeek)} icon={<Flame className="h-4 w-4" />} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Views gained this month" value={formatCompact(stats.viewsGainedThisMonth)} icon={<Flame className="h-4 w-4" />} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard title="Average views / reel" value={formatCompact(stats.averageViewsPerReel)} icon={<BarChart3 className="h-4 w-4" />} />
          <StatCard title="Active tracking" value={formatNumber(stats.activeTracking)} icon={<Activity className="h-4 w-4" />} />
          <StatCard title="Failed / invalid" value={formatNumber(stats.failedInvalid)} icon={<AlertTriangle className="h-4 w-4" />} />
        </div>
      ) : null}

      {/* Top performer + Add */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" /> Top-performing reel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topPerformingReel ? (
              <div className="flex items-center gap-3">
                {stats.topPerformingReel.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stats.topPerformingReel.thumbnailUrl}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/app/reels/${stats.topPerformingReel.id}`}
                    className="font-medium hover:underline"
                  >
                    {stats.topPerformingReel.username ?? "Instagram reel"}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    @{stats.topPerformingReel.instagramReelId} Â· +{formatCompact(stats.topPerformingReel.viewsGained)} gained
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums">
                    {formatCompact(stats.topPerformingReel.currentViews)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">views</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active reels yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Track a new reel</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setAddOpen((v) => !v)}>
              {addOpen ? null : <Plus className="h-4 w-4" />}
              {addOpen ? "Close" : "+ Add Instagram Reel"}
            </Button>
            {addOpen ? (
              <form onSubmit={onAdd} className="mt-3 space-y-2">
                <div>
                  <Label htmlFor="reel-url">Instagram Reel URL</Label>
                  <Input
                    id="reel-url"
                    placeholder="https://www.instagram.com/reel/C123456789/"
                    value={reelUrl}
                    onChange={(e) => setReelUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Add reel
                </Button>
                <p className="text-xs text-muted-foreground">
                  Validates the URL, extracts the reel ID, deduplicates, then starts 30-minute tracking.
                </p>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:max-w-xs md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by reel ID or usernameâ€¦"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm md:w-40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
              <option value="deleted">Deleted</option>
              <option value="metric_unavailable">Metric unavailable</option>
              <option value="pending_connection">Pending connection</option>
              <option value="pending_media_resolution">Pending resolution</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm md:w-44"
            >
              <option value="recent">Recently added</option>
              <option value="views">Highest views</option>
              <option value="growth">Highest growth</option>
              <option value="oldest">Oldest</option>
            </select>
            <div className="md:ml-auto">
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Reel</th>
                  <th className="pb-2 pr-3 font-medium">Views</th>
                  <th className="pb-2 pr-3 font-medium">Gained</th>
                  <th className="pb-2 pr-3 font-medium">Growth</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Last checked</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list?.reels.map((reel) => (
                  <tr key={reel.id} className="border-b last:border-0 hover:bg-accent/40">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        {reel.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reel.thumbnailUrl} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/app/reels/${reel.id}`} className="block max-w-[220px] truncate font-medium hover:underline">
                            {reel.caption || reel.username || `@${reel.instagramReelId}`}
                          </Link>
                          <p className="flex max-w-[220px] items-center gap-1 truncate text-xs text-muted-foreground">
                            {reel.username ?? "instagram"} Â· {reel.instagramReelId}
                            {reel.flaggedForReview ? (
                              <span title="Flagged for review" className="inline-flex text-amber-500">
                                <Flag className="h-3 w-3" />
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold tabular-nums">
                      {["pending_connection", "pending_media_resolution", "metric_unavailable", "failed", "deleted"].includes(reel.trackingStatus) && reel.currentViews === 0
                        ? "—"
                        : formatCompact(reel.currentViews)}
                    </td>
                    <td className="py-3 pr-3 text-emerald-600 tabular-nums dark:text-emerald-400">
                      +{formatCompact(reel.viewsGained)}
                    </td>
                    <td className="py-3 pr-3 tabular-nums text-muted-foreground">{growth(reel.initialViews, reel.currentViews)}</td>
                    <td className="py-3 pr-3">
                      <Badge className={STATUS_STYLES[reel.trackingStatus] ?? ""}>{reel.trackingStatus}</Badge>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {reel.lastCheckedAt ? timeAgo(reel.lastCheckedAt) : "never"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh now" disabled={busyId === reel.id} onClick={() => void runAction(reel.id, "refresh")}>
                          {busyId === reel.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </Button>
                        {reel.trackingStatus === "active" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Pause tracking" disabled={busyId === reel.id} onClick={() => void runAction(reel.id, "pause")}>
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        ) : reel.trackingStatus === "paused" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Resume tracking" disabled={busyId === reel.id} onClick={() => void runAction(reel.id, "resume")}>
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {stats?.isAdmin ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Delete reel" disabled={busyId === reel.id} onClick={() => void runAction(reel.id, "delete")}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {list && list.reels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      {loading ? "Loadingâ€¦" : "No reels match. Add your first one above."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {list && list.pages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page} of {list.pages} Â· {formatNumber(list.total)} reels
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= list.pages || loading} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
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
        <p className={"mt-1 text-2xl font-bold tabular-nums " + (accent ?? "")}>{value}</p>
      </CardContent>
    </Card>
  );
}