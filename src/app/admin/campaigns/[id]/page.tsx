import type { Metadata } from "next";
import { AdminCampaignDetailView } from "./campaign-detail-view";
import { campaignService } from "@/lib/services";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await campaignService.getCampaign(id);
  if (!campaign) return { title: "Campaign Not Found" };
  return {
    title: `${campaign.name} - Clip Review`,
    description: `Review creator clip submissions for ${campaign.name} on Clip Matrix.`,
  };
}

export default async function AdminCampaignDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminCampaignDetailView campaignId={id} />;
}
