import type { Metadata } from "next";
import { CreatorOverviewView } from "@/app/dashboard/overview-view";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Your Clip Matrix creator overview: views, earnings, campaigns, and recent clips.",
};

export default function DashboardPage() {
  return <CreatorOverviewView />;
}
