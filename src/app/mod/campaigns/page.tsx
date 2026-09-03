import type { Metadata } from "next";
import { ModCampaignsView } from "@/app/mod/campaigns/campaigns-view";

export const metadata: Metadata = {
  title: "Campaigns – Moderator – Clip Matrix",
};

export default function ModCampaignsPage() {
  return <ModCampaignsView />;
}
