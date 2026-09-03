import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { campaignService } from "@/lib/services";
import { ModCampaignDetailView } from "@/app/mod/campaigns/campaign-detail-view";

export const metadata: Metadata = {
  title: "Campaign – Moderator – Clip Matrix",
};

export default async function ModCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await campaignService.getCampaign(id);
  if (!campaign) notFound();
  return <ModCampaignDetailView campaignId={id} />;
}
