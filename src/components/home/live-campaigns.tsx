"use client";

import { campaignService } from "@/lib/services";
import type { Campaign } from "@/lib/services/types";
import { useAsync } from "@/lib/hooks";
import { SectionHeading, Section } from "@/components/marketing/section";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { ButtonLink } from "@/components/ui/button";
import { SkeletonGrid, ErrorState } from "@/components/ui/skeleton";

export function LiveCampaigns() {
  const { data, loading, error, retry } = useAsync<Campaign[]>(
    () => campaignService.listCampaigns({ sort: "rate_desc" }),
    []
  );
  const featured = data?.filter((c) => c.status !== "DRAFT").slice(0, 6) ?? [];

  return (
    <Section alt>
      <SectionHeading
        eyebrow="Live campaigns"
        title="Campaigns Creators Are Clipping Right Now"
        copy="Fresh briefs with transparent rates. Join one and your first clip can be live tonight."
      />
      <div className="mt-14">
        {loading && <SkeletonGrid count={6} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((campaign, index) => (
              <div key={campaign.id} className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
                <CampaignCard campaign={campaign} href={`/dashboard/campaigns/${campaign.id}`} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-12 text-center">
          <ButtonLink href="/campaigns" variant="secondary" size="lg">
            Browse All Campaigns
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
