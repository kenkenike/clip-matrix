import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { campaignService } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { PlatformBadges } from "@/components/ui/platform";
import { Accordion } from "@/components/ui/accordion";
import { MetricCard } from "@/components/ui/metric-card";
import { MiniAreaChart } from "@/components/charts/charts";
import { formatCurrency, formatCompact, formatDate, rateLabel } from "@/lib/format";
import { SubmitClipLauncher } from "@/app/dashboard/campaigns/[id]/submit-launcher";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await campaignService.getCampaign(id);
  if (!campaign) return { title: "Campaign Not Found" };
  return { title: `${campaign.name} - ${campaign.brandName}`, description: campaign.description };
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const [campaign, rules] = await Promise.all([
    campaignService.getCampaign(id),
    campaignService.getRules(id),
  ]);
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <InitialTile label={campaign.brandInitial} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-fg">
                  {campaign.name}
                </h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="mt-1 text-sm text-muted">{campaign.brandName}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="font-semibold text-accent tabular-nums">
                  {formatCurrency(campaign.ratePer100kMinor)}{" "}
                  <span className="font-normal text-muted">per 100K views</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <CalendarDays className="h-4 w-4" /> Ends in {campaign.daysRemaining} days
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <Users className="h-4 w-4" /> {campaign.creatorCount.toLocaleString()} creators
                </span>
              </div>
              <div className="mt-4">
                <PlatformBadges platforms={campaign.platforms} />
              </div>
            </div>
          </div>
          <SubmitClipLauncher
            campaignId={campaign.id}
            campaignName={campaign.name}
            platforms={rules?.allowedPlatforms ?? campaign.platforms}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Campaign Views" value={campaign.totalViews} compact countUp icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clips Published" value={campaign.totalClips} countUp />
        <MetricCard label="Engagement Rate" value={campaign.engagementRate} suffix="%" countUp />
        <MetricCard label="Effective CPM" value={formatCurrency(campaign.cpmMinor, { cents: true })} prefix="$" countUp={false} sub="per 1K verified views" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-fg">About this campaign</h2>
            <p className="mt-3 leading-relaxed text-muted">{campaign.longDescription}</p>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-fg">Source content</h2>
            <div className="mt-4 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-alt p-3"
                >
                  <span className="flex h-11 w-16 items-center justify-center rounded-lg border border-dashed border-line-strong bg-white/[0.03] text-[10px] font-medium tracking-wide text-faint uppercase">
                    Video
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block h-2 w-3/4 rounded-full bg-white/10" />
                    <span className="mt-2 block h-2 w-1/3 rounded-full bg-white/10" />
                  </div>
                  <span className="text-xs text-faint">Episode {i + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-faint">
              Full source files unlock inside the submit flow once you join.
            </p>
          </Card>

          <Card className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <h2 className="font-heading text-base font-semibold text-fg">Content requirements</h2>
              <ul className="mt-3 space-y-2">
                {(rules?.requiredPhrases.length || campaign.contentRequirements.length) > 0 &&
                  (rules?.requiredPhrases ?? campaign.contentRequirements).map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {req}
                    </li>
                  ))}
              </ul>
              {campaign.requiredHashtags.length > 0 && (
                <>
                  <h3 className="mt-5 text-xs font-semibold tracking-wider text-faint uppercase">
                    Required hashtags
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {campaign.requiredHashtags.map((tag) => (
                      <span key={tag} className="rounded-md bg-accent-dim px-2 py-1 text-xs font-medium text-accent">
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {campaign.requiredMentions.length > 0 && (
                <>
                  <h3 className="mt-5 text-xs font-semibold tracking-wider text-faint uppercase">
                    Required mentions
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {campaign.requiredMentions.map((m) => (
                      <span key={m} className="rounded-md bg-accent-dim px-2 py-1 text-xs font-medium text-accent">
                        @{m.replace(/^@/, "")}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-fg">Prohibited content</h2>
              <ul className="mt-3 space-y-2">
                {(rules?.forbiddenContent.length || campaign.prohibitedContent.length) > 0 &&
                  (rules?.forbiddenContent ?? campaign.prohibitedContent).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-fg">Example clips</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {campaign.exampleClips.slice(0, 3).map((clip) => (
                <div key={clip.id} className="overflow-hidden rounded-xl border border-line bg-surface-alt">
                  <div className="radial-glow relative aspect-video w-full border-b border-line bg-surface" aria-hidden="true">
                    <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-extrabold text-white/15">
                      CLIP
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium text-fg">{clip.title}</p>
                    <p className="mt-1 text-xs text-muted tabular-nums">{formatCompact(clip.views)} views</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-6 py-4 font-heading text-lg font-semibold text-fg">
              Frequently asked questions
            </h2>
            <div className="px-6 pb-2">
              <Accordion
                items={campaign.faqs.map((f) => ({
                  question: f.question,
                  answer: f.answer,
                }))}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-semibold text-fg">Payment &amp; rules</h2>
            <dl className="space-y-3.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Rate</dt>
                <dd className="font-semibold text-fg tabular-nums">{rateLabel(campaign.ratePer100kMinor)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Minimum views</dt>
                <dd className="font-semibold text-fg tabular-nums">{formatCompact(campaign.minViews)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Max payout / clip</dt>
                <dd className="font-semibold text-fg tabular-nums">{formatCurrency(campaign.maxPayoutMinor)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Budget used</dt>
                <dd className="font-semibold text-fg tabular-nums">
                  {Math.round((campaign.spentMinor / Math.max(campaign.budgetMinor, 1)) * 100)}%
                </dd>
              </div>
              {rules && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Min followers</dt>
                  <dd className="font-semibold text-fg tabular-nums">{formatCompact(rules.minCreatorFollowers)}</dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Ends</dt>
                <dd className="font-semibold text-fg">{formatDate(campaign.endsAt)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-lg font-semibold text-fg">Performance</h2>
            <div className="mt-4">
              <MiniAreaChart data={campaign.performanceSeries.map((p) => ({ label: p.label, value: p.value }))} />
            </div>
            <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
              {campaign.geoBreakdown.slice(0, 4).map((geo) => (
                <li key={geo.country}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">{geo.country}</span>
                    <span className="tabular-nums text-faint">{geo.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${geo.pct * 2}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-warning/30 p-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-fg">
              <ShieldAlert className="h-4 w-4 text-amber-400" /> Submission rules
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-muted">
              <li>Post on an allowed platform and keep the clip live.</li>
              <li>Submit within {rules?.submissionWindowDays ?? 14} days of joining.</li>
              <li>One submission per clip URL - duplicates are auto-rejected.</li>
              <li>Views are re-checked against platform APIs before payout.</li>
              <li>Flagged clips are reviewed by humans within 48 hours.</li>
            </ul>
          </Card>
        </div>
      </div>

    </div>
  );
}
