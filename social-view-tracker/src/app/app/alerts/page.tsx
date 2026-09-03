"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toaster";

type Alert = {
  id: string;
  label: string;
  kind: string;
  threshold: number;
  status: "ACTIVE" | "PAUSED" | "FIRED";
  firedCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  content: { id: string; title: string | null; url: string } | null;
};

const KIND_LABELS: Record<string, string> = {
  VIEW_MILESTONE: "View milestone",
  VIEW_SPIKE: "View spike",
  GROWTH_THRESHOLD: "Growth threshold",
  MANUAL: "Manual",
};

export default function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [form, setForm] = useState({ label: "", kind: "VIEW_MILESTONE", threshold: "10000" });
  const [creating, setCreating] = useState(false);

  const load = () => {
    void (async () => {
      try {
        const res = await apiFetch<{ alerts: Alert[] }>("/api/alerts");
        setAlerts(res.alerts);
      } catch (err) {
        toast({ kind: "error", title: "Could not load alerts", description: (err as Error).message });
      }
    })();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch("/api/alerts", {
        method: "POST",
        body: JSON.stringify({
          label: form.label,
          kind: form.kind,
          threshold: Number(form.threshold),
        }),
      });
      setForm({ label: "", kind: "VIEW_MILESTONE", threshold: "10000" });
      toast({ kind: "success", title: "Alert created" });
      load();
    } catch (err) {
      toast({ kind: "error", title: "Could not create alert", description: (err as Error).message });
    } finally {
      setCreating(false);
    }
  }

  async function toggleAlert(a: Alert) {
    try {
      await apiFetch(`/api/alerts/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
      });
      load();
    } catch (err) {
      toast({ kind: "error", title: "Could not update alert", description: (err as Error).message });
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return;
    try {
      await apiFetch(`/api/alerts/${id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Alert deleted" });
      load();
    } catch (err) {
      toast({ kind: "error", title: "Could not delete alert", description: (err as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Notify when tracked content reaches thresholds. Delivery uses email (SMTP) and ALERT_FIRED webhooks."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> New alert
          </CardTitle>
          <CardDescription>Applies across all tracked content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAlert} className="grid gap-2 md:grid-cols-[2fr_180px_140px_auto]">
            <div>
              <Label htmlFor="alert-label">Label</Label>
              <Input id="alert-label" placeholder="100k milestone" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="alert-kind">Trigger</Label>
              <Select id="alert-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="VIEW_MILESTONE">Crosses views</option>
                <option value="VIEW_SPIKE">Gains that many views</option>
                <option value="GROWTH_THRESHOLD">Growth % in period</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="alert-threshold">Threshold</Label>
              <Input id="alert-threshold" type="number" min={1} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts === null ? (
            <Skeleton className="h-16" />
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts yet. Create one above.</p>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{a.label}</p>
                    <Badge variant={a.status === "ACTIVE" ? "success" : a.status === "FIRED" ? "warning" : "muted"}>
                      {a.status.toLowerCase()}
                    </Badge>
                    <Badge variant="secondary">{KIND_LABELS[a.kind] ?? a.kind}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Threshold {a.threshold.toLocaleString()}
                    {a.firedCount > 0 ? ` · fired ${a.firedCount}×` : ""}
                    {a.lastTriggeredAt ? ` · last ${formatDateTime(a.lastTriggeredAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleAlert(a)}>
                    {a.status === "ACTIVE" ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteAlert(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}