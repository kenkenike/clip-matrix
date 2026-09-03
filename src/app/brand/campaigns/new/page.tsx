import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Campaign",
  description: "Campaign launches are handled by the Clip Matrix team. Contact us to get started.",
  robots: { index: false },
};

export default function NewCampaignPage() {
  redirect("/contact");
}
