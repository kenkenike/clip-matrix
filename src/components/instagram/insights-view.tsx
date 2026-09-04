"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2, AlertCircle, Camera, Eye, Heart, MessageCircle, Users, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/inputs";
import { Badge } from "@/components/ui/badge";
import { formatCompact } from "@/lib/format";

interface InsightResult {
  type: string;
  url: string;
  caption: string | null;
  timestamp: string | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  engagementRate: number | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  username: string | null;
  fullName: string | null;
  isPrivate: boolean;
  scrapedAt: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "rate_limited";
  result: InsightResult | null;
  error: string | null;
  attempts: number;
}

const POLL_INTERVAL = 1500;
const MAX_POLL_ATTEMPTS = 40;

export function InstagramInsightsView() {
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<InsightResult | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/instagram/insights/${id}`);
      if (!res.ok) throw new Error("Failed to fetch job status");
      const data: JobStatus = await res.json();
      setJobStatus(data);

      if (data.status === "completed" && data.result) {
        stopPolling();
        setResult(data.result);
        setScrapeError(null);
        return;
      }

      if (data.status === "failed") {
        stopPolling();
        setScrapeError(data.error ?? "Scrape failed");
        return;
      }

      if (data.status === "rate_limited") {
        stopPolling();
        setScrapeError("Instagram is rate-limiting requests. Try again in a few minutes.");
        return;
      }

      pollCountRef.current++;
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setScrapeError("Scrape timed out — Instagram may be slow to respond. Try again shortly.");
        return;
      }
    } catch {
      stopPolling();
      setScrapeError("Lost connection while polling. Try again.");
    }
  }, [stopPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    setResult(null);
    setScrapeError(null);
    setJobStatus(null);
    stopPolling();

    const trimmed = url.trim();
    if (!trimmed) {
      setInputError("Enter an Instagram URL");
      return;
    }
    if (!trimmed.includes("instagram.com")) {
      setInputError("Must be an instagram.com URL");
      return;
    }

    try {
      const res = await fetch("/api/instagram/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInputError(data.error ?? "Invalid request");
        return;
      }
      setJobId(data.jobId);
      setJobStatus({ id: data.jobId, status: "pending", result: null, error: null, attempts: 0 });
      pollCountRef.current = 0;
      pollRef.current = setInterval(() => pollJob(data.jobId), POLL_INTERVAL);
    } catch {
      setInputError("Could not reach server");
    }
  };

  const handleReset = () => {
    stopPolling();
    setUrl("");
    setInputError(null);
    setJobId(null);
    setJobStatus(null);
    setResult(null);
    setScrapeError(null);
  };

  const isRunning = jobStatus?.status === "pending" || jobStatus?.status === "running";
  const statusLabel = jobStatus?.status === "pending"
    ? "Queued..."
    : jobStatus?.status === "running"
      ? `Scraping... (attempt ${jobStatus.attempts})`
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-pink-400" />
              Instagram Insights
            </span>
          }
          subtitle="Paste a post, reel, or profile URL to scrape public engagement data"
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setInputError(null); }}
                placeholder="https://www.instagram.com/p/ABC123/ or /username/"
                error={inputError}
                disabled={isRunning}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isRunning}>
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {statusLabel}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Analyze
                  </span>
                )}
              </Button>
              {(result || scrapeError) && (
                <Button type="button" variant="ghost" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {scrapeError && (
        <Card className="border-red-500/30">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Scrape failed</p>
                <p className="mt-1 text-sm text-muted">{scrapeError}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {isRunning && !result && (
        <Card className="border-accent/30">
          <CardBody>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <div>
                <p className="text-sm font-medium text-fg">{statusLabel}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {jobStatus?.attempts === 1 && "Trying direct HTTP fetch..."}
                  {jobStatus?.attempts === 2 && "Falling back to headless browser..."}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: InsightResult }) {
  const typeLabel = result.type === "profile" ? "Profile" : result.type === "reel" ? "Reel" : "Post";

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            {result.type === "profile" ? (
              <span>@{result.username ?? "unknown"}</span>
            ) : (
              <span>{typeLabel} Insight</span>
            )}
          </span>
        }
        subtitle={result.fullName && result.type === "profile" ? result.fullName : undefined}
        action={
          <Badge tone={result.isPrivate ? "warning" : "success"}>
            {result.isPrivate ? "Private" : "Public"}
          </Badge>
        }
      />
      <CardBody className="space-y-5">
        {result.type === "profile" ? (
          <div className="grid grid-cols-3 gap-4">
            <StatBlock icon={Users} label="Followers" value={result.followers} />
            <StatBlock icon={Users} label="Following" value={result.following} />
            <StatBlock icon={Camera} label="Posts" value={result.postsCount} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <StatBlock icon={Eye} label="Views" value={result.views} />
              <StatBlock icon={Heart} label="Likes" value={result.likes} />
              <StatBlock icon={MessageCircle} label="Comments" value={result.comments} />
            </div>
            {result.engagementRate != null && (
              <div className="flex items-center gap-2 rounded-none border border-line bg-surface-alt px-4 py-3">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted">Engagement Rate</span>
                <span className="ml-auto text-sm font-semibold text-accent">{result.engagementRate}%</span>
              </div>
            )}
          </>
        )}

        {result.caption && (
          <div className="rounded-none border border-line bg-surface-alt px-4 py-3">
            <p className="text-xs font-medium text-muted mb-1">Caption</p>
            <p className="text-sm text-fg line-clamp-3">{result.caption}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-line pt-3">
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-accent hover:underline"
          >
            Open on Instagram
          </a>
          <span className="text-xs text-faint">
            Scraped {new Date(result.scrapedAt).toLocaleTimeString()}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-none border border-line bg-surface-alt px-3 py-4 text-center">
      <Icon className="h-4 w-4 text-accent" />
      <span className="text-lg font-semibold text-fg tabular-nums">
        {value != null ? formatCompact(value) : "—"}
      </span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
