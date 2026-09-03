import type { Metadata } from "next";
import { AdminSubmissionsView } from "@/app/admin/submissions-view";

export const metadata: Metadata = {
  title: "Submissions",
  description: "Moderation queue for creator clip submissions across all campaigns.",
};

export default function AdminSubmissionsPage() {
  return <AdminSubmissionsView />;
}
