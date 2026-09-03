import type { Metadata } from "next";
import { ModSubmissionsView } from "@/app/mod/submissions-view";

export const metadata: Metadata = {
  title: "Clip Review – Moderator – Clip Matrix",
  description: "Review and moderate creator clip submissions.",
};

export default function ModSubmissionsPage() {
  return <ModSubmissionsView />;
}
