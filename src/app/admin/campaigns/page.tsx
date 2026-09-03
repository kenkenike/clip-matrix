import type { Metadata } from "next";
import { AdminCampaignsView } from "@/app/admin/campaigns-view";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Every campaign across the marketplace with spend and creator counts.",
};

export default function AdminCampaignsPage() {
  return <AdminCampaignsView />;
}
