import Link from "next/link";
import {
  AreaChart,
  BarChart3,
  Bell,
  Camera,
  Filter,
  HardDriveDownload,
  KeyRound,
  LineChart,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  Webhook,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: LineChart,
    title: "Public metrics only",
    body: "Views, likes, and comments via official platform APIs. If a metric cannot be legally obtained, it is reported as Unavailable — never fabricated.",
  },
  {
    icon: RefreshCw,
    title: "Automated collection",
    body: "A background worker checks your content on a schedule and stores a full snapshot history for every run.",
  },
  {
    icon: Bell,
    title: "Smart alerts",
    body: "Get notified when a video crosses a view milestone, spikes in a short window, or grows beyond a threshold.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    body: "Push CONTENT_CHECKED, ALERT_FIRED, and CONTENT_FAILED events to your own endpoints, signed with HMAC.",
  },
  {
    icon: KeyRound,
    title: "Developer API",
    body: "Consume everything over JSON: list content, pull snapshots, and export CSV/JSON with scoped API keys.",
  },
  {
    icon: HardDriveDownload,
    title: "Portable exports",
    body: "Download clean CSV or JSON of every tracked item and its latest metrics whenever you need it.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
            </span>
            Social View Tracker
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink href="/login" variant="ghost" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Official APIs · No scraping
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Track how your content grows.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Watch views, likes, and comments climb for your YouTube and Instagram posts — with
              honest numbers, scheduled collection, alerts, and a developer API.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/register" size="lg">
                Start tracking free
              </ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">
                Sign in
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free plan: 10 tracked URLs · daily checks · 1 API key
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <CardContent className="py-5">
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Metrics you can trust. Literally.
                </h2>
                <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    YouTube data comes from the official Data API. Instagram metrics come from the
                    Graph API for linked Business accounts.
                  </p>
                  <p className="flex gap-2">
                    <Camera className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    No HTML scraping, no login bypass, no fabricated demo numbers. If data is not
                    available, the status says <em>Unavailable</em> and why.
                  </p>
                  <p className="flex gap-2">
                    <AreaChart className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    Every successful check appends to a history you can chart, export, and replay.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <Video className="h-4 w-4 text-primary" />
                      <span className="font-mono-nums text-sm font-semibold">1.2M</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Views (YouTube API)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="font-mono-nums text-sm font-semibold">24.1k</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Likes across content</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="font-mono-nums text-sm font-semibold">3,015</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Comments collected</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-5">
                    <div className="flex items-center justify-between">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="font-mono-nums text-sm font-semibold">14</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Alerts triggered</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Social View Tracker. Not affiliated with YouTube or Instagram.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Respects platform access controls
            </span>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = "force-static";

export const revalidate = 3600;