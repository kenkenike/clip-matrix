import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { campaignService } from "@/lib/services";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata: Metadata = {
  title: "Edit Campaign – Admin – Clip Matrix",
};

export default async function AdminEditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await campaignService.getCampaign(id);
  if (!campaign) notFound();
  return <CampaignForm mode="edit" initial={campaign} campaignId={id} />;
}
