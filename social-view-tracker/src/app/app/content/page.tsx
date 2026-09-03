"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { formatCompact, formatNumber, formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformBadge } from "@/components/platform-badge";
import { StatusBadge, type TrackStatus } from "@/components/status-badge";
import { KIND_NAMES } from "@/lib/ui-constants";
import { useToast } from "@/components/toaster";

type ContentItem = {
  id: string;
  platform: "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "X";
  kind: string;
  url: string;
  title: string | null;
  caption: string | null;
  accountName: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  status: TrackStatus;
  source: "OFFICIAL" | "WEB" | null;
  lastError: string | null;
  lastCheckedAt: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  viewsGained: number | null;
  growthPct: number | null;
  createdAt: string;
  updatedAt: string;
};

type PageData = {
  items: ContentItem[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
};

type SortKey = "views" | "likes" | "comments" | "updatedAt" | "publishedAt";

export default function ContentPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("updatedAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20", sort, dir });
      if (platform) params.set("platform", platform);
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      const result = await apiFetch<PageData>(`/api/content?${params.toString()}`);
      setData(result);
    } catch (err) {
      toast({ kind: "error", title: "Could not load content", description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [page, platform, status, q, sort, dir, toast]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: "20", sort, dir });
        if (platform) params.set("platform", platform);
        if (status) params.set("status", status);
        if (q) params.set("q", q);
        const result = await apiFetch<PageData>(`/api/content?${params.toString()}`);
        if (controller.signal.aborted) return;
        setData(result);
      } catch (err) {
        if (controller.signal.aborted) return;
        toast({ kind: "error", title: "Could not load content", description: (err as Error).message });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [page, platform, status, q, sort, dir, toast]);

  function onSearch(value: string) {
    setQ(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  }

  async function onRefresh(id: string) {
    setRefreshingId(id);
    try {
      await apiFetch(`/api/content/${id}/refresh`, { method: "POST" });
      toast({ kind: "success", title: "Check queued", description: "The worker will refresh metrics shortly." });
      setTimeout(load, 1500);
    } catch (err) {
      toast({ kind: "error", title: "Refresh failed", description: (err as Error).message });
    } finally {
      setRefreshingId(null);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this item and its snapshot history?")) return;
    try {
      await apiFetch(`/api/content/${id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Removed" });
      load();
    } catch (err) {
      toast({ kind: "error", title: "Could not remove", description: (err as Error).message });
    }
  }

  function toggleSort(next: SortKey) {
    if (sort === next) {
      setDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(next);
      setDir("desc");
    }
  }

  return (
    <div>
      <PageHeader
        title="Content"
        description="Every URL you track and its latest collected metrics."
        actions={
          <ButtonLink href="/app/add">Track new content</ButtonLink>
        }
      />

      <Card className="mb-4 p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="Search by title, account, or URL…"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search content"
          />
          <Select value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }} aria-label="Platform">
            <option value="">All platforms</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
            <option value="X">X (Twitter)</option>
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            <option value="">All statuses</option>
            <option value="COMPLETED">Complete</option>
            <option value="PROCESSING">Collecting</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="FAILED">Failed</option>
            <option value="RATE_LIMITED">Rate limited</option>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <SortHeader label="Views" sortKey="views" sort={sort} dir={dir} onClick={toggleSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Likes" sortKey="likes" sort={sort} dir={dir} onClick={toggleSort} />
              </TableHead>
              <TableHead>
                <SortHeader label="Comments" sortKey="comments" sort={sort} dir={dir} onClick={toggleSort} />
              </TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data && data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  <p>Nothing tracked yet.</p>
                  <ButtonLink href="/app/add" variant="outline" size="sm" className="mt-3">
                    Track your first URL
                  </ButtonLink>
                </TableCell>
              </TableRow>
            ) : (
              (data?.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/app/content/${item.id}`} className="group flex max-w-[320px] items-center gap-3">
                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnailUrl} alt="" className="h-10 w-16 shrink-0 rounded border object-cover" loading="lazy" />
                      ) : (
                        <div className="h-10 w-16 shrink-0 rounded border bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-primary">{item.title ?? "Untitled"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {KIND_NAMES[item.kind] ?? item.kind}
                          {item.accountName ? ` · ${item.accountName}` : ""}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell><PlatformBadge platform={item.platform} /></TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={item.status} />
                      {item.source === "WEB" ? (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          public page
                        </span>
                      ) : item.source === "OFFICIAL" ? (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          official API
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono-nums text-sm">{item.views === null ? "—" : formatCompact(item.views)}</TableCell>
                  <TableCell className="font-mono-nums text-sm">{item.likes === null ? "—" : formatCompact(item.likes)}</TableCell>
                  <TableCell className="font-mono-nums text-sm">{item.comments === null ? "—" : formatCompact(item.comments)}</TableCell>
                  <TableCell className="text-right">
                    <p className="font-mono-nums text-xs">{item.lastCheckedAt ? timeAgo(item.lastCheckedAt) : "never"}</p>
                    <p className="text-xs text-muted-foreground">{item.lastCheckedAt ? formatDateTime(item.lastCheckedAt) : ""}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={item.url} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="Open original">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => onRefresh(item.id)} disabled={refreshingId === item.id || item.status === "PROCESSING"} title="Re-check now">
                        <RefreshCw className={cn("h-4 w-4", refreshingId === item.id && "animate-spin")} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data && data.pagination.pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing page {data.pagination.page} of {data.pagination.pages} · {formatNumber(data.pagination.total)} total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortKey;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
}) {
  const active = sort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      {active ? (
        dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}