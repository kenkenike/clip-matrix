import type { Metadata } from "next";
import { CampaignForm } from "@/components/admin/campaign-form";

export const metadata: Metadata = {
  title: "New Campaign – Admin – Clip Matrix",
};

export default function AdminNewCampaignPage() {
  return <CampaignForm mode="create" />;
}
