import type { Metadata } from "next";
import { AdminOverviewView } from "@/app/admin/overview-view";

export const metadata: Metadata = {
  title: "Overview",
  description: "Platform-wide health, growth, and revenue metrics for Clip Matrix.",
};

export default function AdminOverviewPage() {
  return <AdminOverviewView />;
}
