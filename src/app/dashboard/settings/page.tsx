import type { Metadata } from "next";
import { SettingsView } from "@/app/dashboard/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Clip Matrix profile and notification preferences.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
