import type { Metadata } from "next";
import { CampaignDiscovery } from "@/app/dashboard/campaigns/discovery";

export const metadata: Metadata = {
  title: "Browse Campaigns",
  description: "Discover live clipping campaigns and join the ones that fit your style.",
};

export default function DashboardCampaignsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Discover Campaigns
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Live briefs with upfront rates. Join as many as you like.
      </p>
      <div className="mt-8">
        <CampaignDiscovery />
      </div>
    </div>
  );
}
