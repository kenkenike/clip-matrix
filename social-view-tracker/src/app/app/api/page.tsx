"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, Trash2, Webhook } from "lucide-react";
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

type ApiKey = { id: string; name: string; prefix: string; scope: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };
type Webhook = { id: string; name: string; url: string; events: string[]; enabled: boolean; createdAt: string };

const ENDPOINTS = [
  { method: "GET", path: "/api/content", desc: "List tracked content (filters: platform, status, q, sort, dir, page, pageSize)" },
  { method: "GET", path: "/api/content/:id/history", desc: "All snapshots for one item" },
  { method: "POST", path: "/api/track", desc: "Track a new URL" },
  { method: "POST", path: "/api/track/bulk", desc: "Track up to 100 URLs" },
  { method: "POST", path: "/api/upload/csv", desc: "Upload a CSV of URLs" },
  { method: "GET", path: "/api/analytics/summary", desc: "Aggregate overview" },
  { method: "GET", path: "/api/analytics/series", desc: "Time series (days, granularity)" },
  { method: "GET", path: "/api/export/csv", desc: "CSV export" },
  { method: "GET", path: "/api/export/json", desc: "JSON export" },
  { method: "GET", path: "/api/usage", desc: "Plan limits and usage" },
];

export default function ApiPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null);
  const [keyName, setKeyName] = useState("");
  const [scope, setScope] = useState("READ");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", events: "CONTENT_CHECKED" });

  const loadAll = () => {
    void (async () => {
      try {
        const [k, w] = await Promise.all([
          apiFetch<{ apiKeys: ApiKey[] }>("/api/api-keys"),
          apiFetch<{ webhooks: Webhook[] }>("/api/webhooks"),
        ]);
        setKeys(k.apiKeys);
        setWebhooks(w.webhooks);
      } catch (err) {
        toast({ kind: "error", title: "Could not load developer settings", description: (err as Error).message });
      }
    })();
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreatingKey(true);
    setNewRawKey(null);
    try {
      const res = await apiFetch<{ apiKey: { rawKey: string; prefix: string; name: string; scope: string } }>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: keyName, scope }),
      });
      setNewRawKey(res.apiKey.rawKey);
      setKeyName("");
      loadAll();
      toast({ kind: "success", title: "Key created", description: "Copy it now — it is shown only once." });
    } catch (err) {
      toast({ kind: "error", title: "Could not create key", description: (err as Error).message });
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key immediately?")) return;
    try {
      await apiFetch(`/api/api-keys/${id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Key revoked" });
      loadAll();
    } catch (err) {
      toast({ kind: "error", title: "Could not revoke key", description: (err as Error).message });
    }
  }

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch("/api/webhooks", {
        method: "POST",
        body: JSON.stringify({
          name: webhookForm.name,
          url: webhookForm.url,
          events: webhookForm.events.split(",").map((s) => s.trim()),
        }),
      });
      setWebhookForm({ name: "", url: "", events: "CONTENT_CHECKED" });
      toast({ kind: "success", title: "Webhook created" });
      loadAll();
    } catch (err) {
      toast({ kind: "error", title: "Could not create webhook", description: (err as Error).message });
    }
  }

  async function toggleWebhook(w: Webhook) {
    try {
      await apiFetch(`/api/webhooks/${w.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !w.enabled }) });
      loadAll();
    } catch (err) {
      toast({ kind: "error", title: "Could not update webhook", description: (err as Error).message });
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook?")) return;
    try {
      await apiFetch(`/api/webhooks/${id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Webhook deleted" });
      loadAll();
    } catch (err) {
      toast({ kind: "error", title: "Could not delete webhook", description: (err as Error).message });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API & Webhooks"
        description="Programmatic access to your tracked data, plus event notifications."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> API keys
          </CardTitle>
          <CardDescription>
            Use a key as <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization: Bearer sk_live_…</code> on any GET endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createKey} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
            <div>
              <Label htmlFor="key-name">Name</Label>
              <Input id="key-name" placeholder="ci / staging / my-script" value={keyName} onChange={(e) => setKeyName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="key-scope">Scope</Label>
              <Select id="key-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="READ">READ</option>
                <option value="WRITE">WRITE</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creatingKey}>
                {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create key
              </Button>
            </div>
          </form>

          {newRawKey ? (
            <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm">
              <p className="font-medium text-success">Copy your new key</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">{newRawKey}</code>
                <Button type="button" variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(newRawKey); toast({ kind: "success", title: "Copied" }); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}

          {keys === null ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="space-y-2">
              {keys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
              ) : (
                keys.map((k) => (
                  <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{k.scope}</Badge>
                      <div>
                        <p className="text-sm font-medium">{k.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          svt_…{k.prefix} · created {formatDateTime(k.createdAt)}
                          {k.lastUsedAt ? ` · last used ${formatDateTime(k.lastUsedAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => revokeKey(k.id)}>
                      <Trash2 className="h-4 w-4" /> Revoke
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-primary" /> Webhooks
          </CardTitle>
          <CardDescription>
            Receive POST requests signed with <code className="rounded bg-muted px-1 py-0.5 text-xs">X-SVT-Signature</code> (HMAC-SHA256).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={createWebhook} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
            <div>
              <Label htmlFor="wh-name">Name</Label>
              <Input id="wh-name" placeholder="Production" value={webhookForm.name} onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input id="wh-url" type="url" placeholder="https://example.com/hooks/svt" value={webhookForm.url} onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="wh-events">Events</Label>
              <Select id="wh-events" value={webhookForm.events} onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.value })}>
                <option value="CONTENT_CHECKED">CONTENT_CHECKED</option>
                <option value="ALERT_FIRED">ALERT_FIRED</option>
                <option value="CONTENT_FAILED">CONTENT_FAILED</option>
                <option value="CONTENT_CHECKED,ALERT_FIRED">CHECKED + ALERTS</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </form>

          {webhooks === null ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="space-y-2">
              {webhooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No webhooks yet.</p>
              ) : (
                webhooks.map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{w.name}</p>
                        <Badge variant={w.enabled ? "success" : "muted"}>{w.enabled ? "enabled" : "disabled"}</Badge>
                      </div>
                      <p className="truncate font-mono text-xs text-muted-foreground">{w.url}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {w.events.map((ev) => (
                          <Badge key={ev} variant="secondary">{ev}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleWebhook(w)}>
                        {w.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteWebhook(w.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Authenticate with a session cookie or a Bearer API key (limited to READ scope for GET).</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {ENDPOINTS.map((ep) => (
            <div key={`${ep.method}${ep.path}`} className="flex flex-wrap items-center gap-2 py-2">
              <span className="w-14 rounded bg-muted px-1.5 py-0.5 text-center text-xs font-semibold text-muted-foreground">{ep.method}</span>
              <code className="min-w-0 flex-1 break-all font-mono text-xs">{ep.path}</code>
              <span className="text-xs text-muted-foreground">{ep.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}