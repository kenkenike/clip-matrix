"use client";

import { useRef, useState } from "react";
import { Eye, FileUp, Heart, Link2, Loader2, ListPlus, MessageCircle, Search, UploadCloud } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toaster";
import { PLATFORM_NAMES, KIND_NAMES, STATUS_NAMES, STATUS_COLORS, SOURCE_LABELS } from "@/lib/ui-constants";
import { formatNumber } from "@/lib/format";

type QuickResult = {
  platform: string;
  kind: string | null;
  status: "COMPLETED" | "UNAVAILABLE" | "RATE_LIMITED" | "FAILED";
  source: "OFFICIAL" | "WEB" | null;
  error: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  title: string | null;
  caption: string | null;
  accountName: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
};

export default function AddContentPage() {
  const { toast } = useToast();
  const [singleUrl, setSingleUrl] = useState("");
  const [singleBusy, setSingleBusy] = useState(false);
  const [quickUrl, setQuickUrl] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quick, setQuick] = useState<QuickResult | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; summary: string; note?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function trackUrl(url: string) {
    const res = await apiFetch<{ content: { id: string }; duplicate: boolean; note?: string }>("/api/track", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    toast({
      kind: "success",
      title: res.duplicate ? "Already tracked" : "Now tracking",
      description: res.note ?? "Collection queued.",
    });
  }

  async function onSubmitSingle(e: React.FormEvent) {
    e.preventDefault();
    setSingleBusy(true);
    setResult(null);
    try {
      await trackUrl(singleUrl);
      setSingleUrl("");
    } catch (err) {
      toast({ kind: "error", title: "Could not track URL", description: (err as Error).message });
    } finally {
      setSingleBusy(false);
    }
  }

  async function onQuickCheck(e: React.FormEvent) {
    e.preventDefault();
    setQuickBusy(true);
    setQuick(null);
    try {
      const res = await apiFetch<QuickResult>("/api/check", {
        method: "POST",
        body: JSON.stringify({ url: quickUrl }),
      });
      setQuick(res);
    } catch (err) {
      toast({ kind: "error", title: "Could not check URL", description: (err as Error).message });
    } finally {
      setQuickBusy(false);
    }
  }

  async function onSubmitBulk(e: React.FormEvent) {
    e.preventDefault();
    const urls = bulkText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (urls.length === 0) return;
    setBulkBusy(true);
    setResult(null);
    try {
      const res = await apiFetch<{ created: number; failed: { error: string }[] }>("/api/track/bulk", {
        method: "POST",
        body: JSON.stringify({ urls }),
      });
      setResult({ created: res.created, failed: res.failed.length, summary: `Tracked ${res.created}, failed ${res.failed.length}` });
      toast({ kind: "success", title: "Bulk tracking complete", description: `${res.created} added, ${res.failed.length} failed` });
      setBulkText("");
    } catch (err) {
      toast({ kind: "error", title: "Bulk tracking failed", description: (err as Error).message });
    } finally {
      setBulkBusy(false);
    }
  }

  function onFileSelected(file: File) {
    void (async () => {
      setCsvBusy(true);
      setResult(null);
      try {
        const text = await file.text();
        const res = await apiFetch<{ created: number; failed: { error: string }[]; skippedRows: number }>("/api/upload/csv", {
          method: "POST",
          body: text,
          headers: { "Content-Type": "text/csv" },
        });
        setResult({ created: res.created, failed: res.failed.length, summary: `Scanned CSV · ${res.created} tracked, ${res.failed.length} invalid, ${res.skippedRows} skipped` });
        toast({ kind: "success", title: "CSV processed", description: `${res.created} tracked, ${res.failed.length} failed` });
      } catch (err) {
        toast({ kind: "error", title: "CSV upload failed", description: (err as Error).message });
      } finally {
        setCsvBusy(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    })();
  }

  return (
    <div>
      <PageHeader
        title="Add content"
        description="Track YouTube, Instagram, TikTok, or X links. YouTube/Instagram prefer official APIs when keys are set; otherwise public-page metrics are collected and labeled as 'Public page'."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Quick check
          </CardTitle>
          <CardDescription>
            Paste any reel, video, or post link and get its views + engagement right away — the link is
            checked live without adding it to your history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onQuickCheck} className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="https://www.instagram.com/reel/…"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              required
            />
            <Button type="submit" disabled={quickBusy} className="shrink-0">
              {quickBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Check now
            </Button>
          </form>

          {quick ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary">
                  {PLATFORM_NAMES[quick.platform] ?? quick.platform}
                </span>
                {quick.kind ? (
                  <span className="rounded bg-secondary px-2 py-1">{KIND_NAMES[quick.kind] ?? quick.kind}</span>
                ) : null}
                <span className="flex items-center gap-1.5 px-1 py-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[quick.status] ?? "#64748b" }}
                  />
                  <span className="font-medium">{STATUS_NAMES[quick.status] ?? quick.status}</span>
                </span>
                {quick.source ? (
                  <span className="rounded bg-muted px-2 py-1 text-muted-foreground">
                    {SOURCE_LABELS[quick.source] ?? quick.source}
                  </span>
                ) : null}
              </div>

              {(quick.accountName || quick.title || quick.caption) && quick.thumbnailUrl ? (
                <div className="mt-3 flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={quick.thumbnailUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    {quick.accountName ? (
                      <p className="truncate text-sm font-medium">{quick.accountName}</p>
                    ) : null}
                    {quick.title ? (
                      <p className="truncate text-xs text-muted-foreground">{quick.title}</p>
                    ) : null}
                    {quick.caption ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{quick.caption}</p>
                    ) : null}
                  </div>
                </div>
              ) : quick.accountName || quick.title || quick.caption ? (
                <div className="mt-3 min-w-0">
                  {quick.accountName ? (
                    <p className="truncate text-sm font-medium">{quick.accountName}</p>
                  ) : null}
                  {quick.title ? (
                    <p className="truncate text-xs text-muted-foreground">{quick.title}</p>
                  ) : null}
                  {quick.caption ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{quick.caption}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 grid max-w-md grid-cols-3 gap-3">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> Views
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(quick.views)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" /> Likes
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(quick.likes)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> Comments
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatNumber(quick.comments)}</p>
                </div>
              </div>

              {quick.error ? (
                <p className="mt-3 rounded bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {quick.error}
                </p>
              ) : null}
              {quick.platform === "INSTAGRAM" && quick.status !== "COMPLETED" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  For your own reels: connect that account&apos;s token and session cookie in
                  Settings → Instagram accounts to get official/session numbers.
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => void trackUrl(quickUrl)}>
                  <ListPlus className="h-4 w-4" /> Track this URL too
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setQuick(null)}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> Single URL
            </CardTitle>
            <CardDescription>Paste one video, reel, or post URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitSingle} className="space-y-3">
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={singleBusy}>
                {singleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Track URL
              </Button>
            </form>
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              <li>· youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, /live/, /embed/, channel @handles</li>
              <li>· instagram.com/p/, /reel/, /tv/ and profiles</li>
              <li>· tiktok.com/@user/video/, tiktok.com/t/, vm.tiktok.com</li>
              <li>· x.com/status/… and twitter.com/status/…</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListPlus className="h-4 w-4 text-primary" /> Bulk paste
            </CardTitle>
            <CardDescription>One URL per line. Deduplicated automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitBulk} className="space-y-3">
              <Textarea
                rows={8}
                placeholder={"https://youtu.be/abc\nhttps://youtu.be/def\nhttps://www.instagram.com/reel/ghj/"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
              />
              <Button type="submit" disabled={bulkBusy}>
                {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Track all (max 100)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-primary" /> Upload CSV
          </CardTitle>
          <CardDescription>One URL per row. A .csv or .txt file under 2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              id="csv-input"
              className="block w-full max-w-sm text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelected(file);
              }}
            />
            <Button variant="outline" type="button" onClick={() => fileRef.current?.click()} disabled={csvBusy}>
              {csvBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Choose file
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card className="mt-4">
          <CardContent className="py-4">
            <p className="text-sm font-medium">{result.summary}</p>
            {result.note ? <p className="mt-1 text-xs text-muted-foreground">{result.note}</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}