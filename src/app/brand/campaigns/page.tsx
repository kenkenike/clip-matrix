import type { Metadata } from "next";
import { BrandCampaignsView } from "@/app/brand/campaigns/campaigns-view";

export const metadata: Metadata = {
  title: "Your Campaigns",
  description: "Manage your Clip Matrix campaigns: status, budgets, and performance.",
};

export default function BrandCampaignsPage() {
  return <BrandCampaignsView />;
}
