import type { Metadata } from "next";
import { AdminSettingsView } from "@/app/admin/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Platform fee, payout schedule, and feature flag configuration.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsView />;
}
