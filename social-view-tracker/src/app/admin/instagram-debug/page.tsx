"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Plug, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toaster";

type Connection = {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
  tokenExpiresAt: string | null;
  scopes: string[];
  isBusinessLinked: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  tokenMasked: string;
};

type ConnectionsResponse = {
  oauthConfigured: boolean;
  requestedScopes: string[] | null;
  connections: Connection[];
};

type PipelineStep = {
  step?: number;
  name: string;
  ok: boolean;
  detail?: string;
};

type PipelineResult = {
  ok: boolean;
  status?: string;
  message?: string;
  pipeline: PipelineStep[];
  metrics?: {
    mediaId: string;
    views: number | null;
    likes: number | null;
    comments: number | null;
    retrievedAt: string;
    source: string;
  } | null;
  callSummary?: {
    provider: string;
    endpoint: string;
    httpStatus?: number;
    responseTimeMs: number;
    category?: string;
    errorMessage?: string;
    metricRequested?: string;
  };
};

export default function InstagramDebugPage() {
  const { toast } = useToast();
  const [conn, setConn] = useState<ConnectionsResponse | null>(null);
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<ConnectionsResponse>("/api/instagram/connections")
      .then(setConn)
      .catch(() => setConn({ oauthConfigured: false, requestedScopes: null, connections: [] }));
  }, []);

  async function runPipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await apiFetch<PipelineResult>("/api/instagram/test-metrics", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      setResult(res);
    } catch (err) {
      toast({ kind: "error", title: "Pipeline failed", description: (err as Error).message });
    } finally {
      setRunning(false);
    }
  }

  async function testConnection(id: string) {
    setTestingId(id);
    try {
      const res = await apiFetch<Record<string, unknown>>("/api/instagram/test-connection", {
        method: "POST",
        body: JSON.stringify({ connectionId: id }),
      });
      toast({
        kind: res.ok ? "success" : "error",
        title: res.ok ? "Connection verified" : "Connection check failed",
        description: JSON.stringify(res, null, 2).slice(0, 400),
      });
    } catch (err) {
      toast({ kind: "error", title: "Test failed", description: (err as Error).message });
    } finally {
      setTestingId(null);
    }
  }

  const hasConnection = (conn?.connections.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/reels" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Reels
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Instagram API debug</h1>
        <p className="text-sm text-muted-foreground">
          Live check of the authorized-only pipeline. Every step reports the exact endpoint, HTTP
          status, and response time. Views are never fabricated.
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4 text-primary" /> Authorized connection
          </CardTitle>
          <CardDescription>
            Meta OAuth is the only way this app reads Instagram metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={conn?.oauthConfigured ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}>
              {conn ? (conn.oauthConfigured ? "✓ OAuth configured" : "✗ OAuth not configured") : "…"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Scopes: {conn?.requestedScopes?.join(", ") ?? "—"}
            </span>
            <ButtonLink href="/api/instagram/connect" variant="outline" size="sm">
              Connect Instagram
            </ButtonLink>
          </div>

          {!conn ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : hasConnection ? (
            <ul className="divide-y">
              {conn.connections.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      @{c.instagramUsername}
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        IG id {c.instagramUserId}
                      </span>
                      {c.isBusinessLinked ? (
                        <span className="ml-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                          business/creator
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Token {c.tokenMasked}
                      {c.tokenExpiresAt
                        ? ` · expires ${new Date(c.tokenExpiresAt).toLocaleString()}`
                        : " · no expiry"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={testingId === c.id}
                    onClick={() => void testConnection(c.id)}
                  >
                    {testingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Test connection
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No connected account. {conn.oauthConfigured ? "Use the button above to authorize Instagram." : "Set the Meta app env vars first, then connect."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pipeline runner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run the tracking pipeline</CardTitle>
          <CardDescription>
            URL → resolution → metrics → view count, exactly as the scheduled job would.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={runPipeline} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="dbg-url" className="sr-only">
                Instagram Reel URL
              </Label>
              <Input
                id="dbg-url"
                placeholder="https://www.instagram.com/reel/C123456789/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={running || !hasConnection}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Run pipeline
            </Button>
          </form>

          {result ? (
            <div className="space-y-2">
              {result.pipeline.map((step, i) => (
                <div key={`${step.name}-${i}`} className="flex items-start gap-2 rounded border px-3 py-2 text-sm">
                  {step.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">
                      {step.step ? `${step.step}. ` : ""}
                      {step.name}
                    </p>
                    {step.detail ? <p className="truncate text-xs text-muted-foreground">{step.detail}</p> : null}
                  </div>
                </div>
              ))}

              {result.callSummary ? (
                <pre className="overflow-x-auto rounded border p-3 text-xs text-muted-foreground">
                  {JSON.stringify(result.callSummary, null, 2)}
                </pre>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 rounded border px-3 py-2 text-sm">
                <span className="font-semibold">Outcome:</span>
                {result.ok && result.metrics ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {result.metrics.views?.toLocaleString() ?? "—"} views on media {result.metrics.mediaId}{" "}
                    (source {result.metrics.source})
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    {result.message ?? "No view count available — the authorized API does not provide it."}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connect an account first; the pipeline cannot start without an authorized token.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}