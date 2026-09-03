"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Loader2, Plug, Save, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { formatCompact, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/toaster";

type SettingsData = {
  profile: { id: string; name: string; email: string; image: string | null; createdAt: string | null };
  usage: {
    plan: string;
    planStatus: string;
    usage: {
      content: number;
      maxContent: number;
      apiKeys: number;
      maxApiKeys: number;
      checksToday: number;
      apiCallsToday: number;
      checkIntervalMinutes: number;
    };
  };
  notifications: unknown;
};

type InstagramAccount = {
  id: string;
  username: string;
  instagramUserId: string | null;
  accessTokenMasked: string;
  hasInsights: boolean;
  hasSession: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
};

type OAuthConnection = {
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
  connections: OAuthConnection[];
};

export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [data, setData] = useState<SettingsData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [igAccounts, setIgAccounts] = useState<InstagramAccount[]>([]);
  const [igToken, setIgToken] = useState("");
  const [igInsightsToken, setIgInsightsToken] = useState("");
  const [igSessionCookie, setIgSessionCookie] = useState("");
  const [igSaving, setIgSaving] = useState(false);
  const [igDeleting, setIgDeleting] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectionsResponse | null>(null);
  const [connDeleting, setConnDeleting] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<SettingsData>("/api/settings");
        setData(res);
        setName(res.profile?.name ?? "");
        setEmail(res.profile?.email ?? "");
      } catch (err) {
        toast({ kind: "error", title: "Could not load settings", description: (err as Error).message });
      }
      try {
        const res = await apiFetch<{ accounts: InstagramAccount[] }>("/api/settings/instagram");
        setIgAccounts(res.accounts);
      } catch {
        // Instagram accounts are optional; a failure here is not fatal.
      }
      try {
        const res = await apiFetch<ConnectionsResponse>("/api/instagram/connections");
        setConnections(res);
      } catch {
        setConnections({ oauthConfigured: false, requestedScopes: null, connections: [] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const status = searchParams.get("ig_status");
    if (!status) return;
    if (status === "connected") {
      toast({
        kind: "success",
        title: "Instagram connected",
        description: `@${searchParams.get("ig_username") ?? "account"} can now authorize reel metrics.`,
      });
    } else {
      toast({
        kind: "error",
        title: "Instagram connection failed",
        description: searchParams.get("ig_error") ?? "Unknown OAuth error.",
      });
    }
  }, [searchParams, toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ profile: { name: string; email: string } }>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setData((d) => (d ? { ...d, profile: { ...d.profile, name: res.profile.name, email: res.profile.email } } : d));
      toast({ kind: "success", title: "Profile updated" });
    } catch (err) {
      toast({ kind: "error", title: "Could not save", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function addInstagram(e: React.FormEvent) {
    e.preventDefault();
    if (!igToken.trim()) return;
    setIgSaving(true);
    try {
      const res = await apiFetch<{ account: InstagramAccount }>("/api/settings/instagram", {
        method: "POST",
        body: JSON.stringify({
          accessToken: igToken.trim(),
          insightsAccessToken: igInsightsToken.trim() || undefined,
          sessionCookie: igSessionCookie.trim() || undefined,
        }),
      });
      setIgAccounts((prev) => [
        ...prev.filter((a) => a.username !== res.account.username),
        res.account,
      ]);
      setIgToken("");
      setIgInsightsToken("");
      setIgSessionCookie("");
      toast({ kind: "success", title: "Instagram account connected", description: `@${res.account.username} is now used for official reads.` });
    } catch (err) {
      toast({ kind: "error", title: "Could not connect account", description: (err as Error).message });
    } finally {
      setIgSaving(false);
    }
  }

  async function removeInstagram(id: string) {
    setIgDeleting(id);
    try {
      await apiFetch(`/api/settings/instagram/${id}`, { method: "DELETE" });
      setIgAccounts((prev) => prev.filter((a) => a.id !== id));
      toast({ kind: "success", title: "Account removed" });
    } catch (err) {
      toast({ kind: "error", title: "Could not remove account", description: (err as Error).message });
    } finally {
      setIgDeleting(null);
    }
  }

  async function removeConnection(id: string) {
    setConnDeleting(id);
    try {
      await apiFetch(`/api/instagram/connections/${id}`, { method: "DELETE" });
      setConnections((c) =>
        c ? { ...c, connections: c.connections.filter((x) => x.id !== id) } : c,
      );
      toast({ kind: "success", title: "Instagram connection removed" });
    } catch (err) {
      toast({ kind: "error", title: "Could not remove connection", description: (err as Error).message });
    } finally {
      setConnDeleting(null);
    }
  }

  const usage = data?.usage?.usage;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, plan status, and usage." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your display name and email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
              </div>
              <div>
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </form>
            {data?.profile?.createdAt ? (
              <p className="mt-4 text-xs text-muted-foreground">Account created {formatDateTime(data.profile.createdAt)}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan & usage</CardTitle>
            <CardDescription>
              Current plan: <strong className="capitalize">{data?.usage?.plan ?? "…"}</strong>
              {data?.usage?.planStatus && data.usage.planStatus !== "active" ? ` (${data.usage.planStatus})` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!usage ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <UsageRow
                  label="Tracked content"
                  current={usage.content}
                  max={usage.maxContent}
                  suffix="items"
                />
                <UsageRow
                  label="API keys"
                  current={usage.apiKeys}
                  max={usage.maxApiKeys}
                  suffix="keys"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Checks today</p>
                    <p className="font-mono-nums mt-1 text-lg font-semibold">{formatCompact(usage.checksToday)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">API calls today</p>
                    <p className="font-mono-nums mt-1 text-lg font-semibold">{formatCompact(usage.apiCallsToday)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatic re-check interval: every {usage.checkIntervalMinutes} minutes.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instagram accounts</CardTitle>
          <CardDescription>
            Connect each Business/Creator account you own with a long-lived access token. Metrics for
            that account&apos;s posts are then read via the official Graph API (source: official API)
            instead of the public page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {igAccounts.length > 0 ? (
            <ul className="divide-y">
              {igAccounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span className="text-muted-foreground">@</span>
                      {a.username}
                      {a.instagramUserId ? (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          official API
                        </span>
                      ) : null}
                      {a.hasInsights ? (
                        <span className="ml-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                          views via insights
                        </span>
                      ) : null}
                      {a.hasSession ? (
                        <span className="ml-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                          session scrape
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Token {a.accessTokenMasked}
                      {a.lastVerifiedAt ? ` · verified ${formatDateTime(a.lastVerifiedAt)}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => void removeInstagram(a.id)}
                    disabled={igDeleting === a.id}
                    aria-label={`Remove @${a.username}`}
                  >
                    {igDeleting === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No accounts connected yet. Add one below to unlock official Instagram reads.
            </p>
          )}

          <form onSubmit={addInstagram} className="flex flex-col gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="ig-token">Long-lived access token</Label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="ig-token"
                  type="password"
                  placeholder="IGAA-…"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  autoComplete="off"
                  required
                />
                <Button type="submit" disabled={igSaving || igToken.trim() === ""} className="shrink-0">
                  {igSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Connect account
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="ig-insights-token">Optional: insights token (official reel views)</Label>
              <Input
                id="ig-insights-token"
                type="password"
                placeholder="EAA-… (Facebook Login token with instagram_business_manage_insights)"
                value={igInsightsToken}
                onChange={(e) => setIgInsightsToken(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="ig-session">Optional: session cookie (Apify-style video views)</Label>
              <Input
                id="ig-session"
                type="password"
                placeholder="sessionid=… from your logged-in browser (must match this account)"
                value={igSessionCookie}
                onChange={(e) => setIgSessionCookie(e.target.value)}
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The access token is validated against Instagram immediately, stored locally, and never
              shown again. With only the access token, likes and comments are official but reel view
              counts stay blank. A Facebook Login insights token (instagram_business_manage_insights)
              adds official plays for Business accounts. Alternatively, paste this account&apos;s own
              <code> sessionid</code> cookie to read view counts the same way Apify does — the app
              only ever reads your own accounts&apos; data with a session you supply.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" /> Instagram connection (reels)
          </CardTitle>
          <CardDescription>
            Authorize your Instagram Business/Creator account with Meta. Reel metrics (including
            official plays/views) are then read through the authorized Instagram Graph API only —
            never from the public page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {connections?.oauthConfigured ? (
              <ButtonLink href="/api/instagram/connect">
                <ExternalLink className="h-4 w-4" /> Connect with Meta
              </ButtonLink>
            ) : (
              <Button disabled aria-disabled>
                <ExternalLink className="h-4 w-4" /> Connect with Meta
              </Button>
            )}
            {connections && !connections.oauthConfigured ? (
              <span className="text-xs text-muted-foreground">
                Meta OAuth is not configured on this server (add META_APP_ID, META_APP_SECRET,
                META_REDIRECT_URI to enable Connect with Meta).
              </span>
            ) : null}
          </div>

          {!connections ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : connections.connections.length > 0 ? (
            <ul className="divide-y">
              {connections.connections.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      @{c.instagramUsername}
                      {c.isBusinessLinked ? (
                        <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                          business/creator
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      IG id {c.instagramUserId} · {c.scopes.join(", ")}
                      {c.tokenExpiresAt
                        ? ` · expires ${formatDateTime(c.tokenExpiresAt)}`
                        : " · no expiry"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => void removeConnection(c.id)}
                    disabled={connDeleting === c.id}
                    aria-label={`Disconnect @${c.instagramUsername}`}
                  >
                    {connDeleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No authorized connection yet. Connecting unlocks official reel view tracking.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsageRow({ label, current, max, suffix }: { label: string; current: number; max: number; suffix: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono-nums">
          {current} / {max} {suffix}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}