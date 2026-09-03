"use client";

import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import type { Campaign } from "@/lib/services/types";
import { brandService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { PlatformBadges } from "@/components/ui/platform";
import { ProgressBar } from "@/components/ui/progress";
import { SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { formatCompact, formatCurrency, formatDateShort } from "@/lib/format";

export function BrandCampaignsView() {
  const { data, loading, error, retry } = useAsync<Campaign[]>(() => brandService.listBrandCampaigns(), []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Campaigns</h1>
          <p className="mt-1.5 text-sm text-muted">Everything you have launched, at a glance.</p>
        </div>
        <ButtonLink href="/contact" size="lg">
          <PlusCircle className="h-4 w-4" /> New Campaign
        </ButtonLink>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={retry} />}
      {data && data.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-heading text-lg font-semibold text-fg">No campaigns yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Launch your first campaign and creators can start clipping within the hour.
          </p>
          <ButtonLink href="/contact" size="lg" className="mt-6">
            Launch Campaign
          </ButtonLink>
        </Card>
      )}
      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((campaign) => {
            const pct = Math.min(100, Math.round((campaign.spentMinor / Math.max(campaign.budgetMinor, 1)) * 100));
            return (
              <Link
                key={campaign.id}
                href={`/brand/campaigns/${campaign.id}`}
                className="card-hover-lift block rounded-none border border-line bg-surface p-5 transition-colors hover:border-accent/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <InitialTile label={campaign.brandInitial} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="font-heading text-base font-semibold text-fg">{campaign.name}</h2>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {campaign.category} · Ends in {campaign.daysRemaining} days ·{" "}
                        {campaign.creatorCount.toLocaleString()} creators ·{" "}
                        {formatCompact(campaign.totalViews)} views
                      </p>
                      <div className="mt-3">
                        <PlatformBadges platforms={campaign.platforms} />
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-56 sm:w-56">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted tabular-nums">{formatCurrency(campaign.spentMinor)} spent</span>
                      <span className="tabular-nums text-faint">{formatCurrency(campaign.budgetMinor)}</span>
                    </div>
                    <ProgressBar value={pct} max={100} className="mt-2" />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent">
                        {formatCurrency(campaign.ratePer100kMinor)} / 100K
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        Manage <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          <p className="pt-2 text-center text-xs text-faint">
            Last refreshed {formatDateShort(new Date().toISOString())}
          </p>
        </div>
      )}
    </div>
  );
}
