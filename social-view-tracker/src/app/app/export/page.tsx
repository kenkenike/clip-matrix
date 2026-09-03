"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/toaster";

type ExportResponse = { rows: unknown[]; summary: { count: number }; csvText?: string; jsonText?: string };

export default function ExportPage() {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"csv" | "json" | null>(null);

  function buildQuery(): string {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  function download(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onExport(kind: "csv" | "json") {
    setBusy(kind);
    try {
      const res = await apiFetch<ExportResponse>(`/api/export/${kind}${buildQuery()}`);
      if (kind === "csv" && res.csvText) {
        download(`social-view-tracker-${new Date().toISOString().slice(0, 10)}.csv`, res.csvText, "text/csv;charset=utf-8");
      } else if (kind === "json" && res.jsonText) {
        download(`social-view-tracker-${new Date().toISOString().slice(0, 10)}.json`, res.jsonText, "application/json");
      }
      toast({ kind: "success", title: "Export ready", description: `${res.summary.count} rows exported.` });
    } catch (err) {
      toast({ kind: "error", title: "Export failed", description: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Export"
        description="Download every tracked item and its latest metrics. Use the API for full programmatic access."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Restrict the export to a platform or status before downloading.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
              <option value="">All platforms</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="X">X (Twitter)</option>
            </Select>
          </div>
          <div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="">All statuses</option>
              <option value="COMPLETED">Complete</option>
              <option value="PROCESSING">Collecting</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="FAILED">Failed</option>
              <option value="RATE_LIMITED">Rate limited</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button onClick={() => onExport("csv")} disabled={busy !== null}>
              {busy === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => onExport("json")} disabled={busy !== null}>
              {busy === "json" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
              Export JSON
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
              <Download className="h-4 w-4" />
              Auto-downloads latest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}