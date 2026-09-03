import type { Metadata } from "next";
import { ClipsView } from "@/app/dashboard/clips/clips-view";

export const metadata: Metadata = {
  title: "My Clips",
  description: "Track every clip you have submitted: views, status, and earnings.",
};

export default function ClipsPage() {
  return <ClipsView />;
}
