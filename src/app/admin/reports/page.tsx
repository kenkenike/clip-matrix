import type { Metadata } from "next";
import { AdminReportsView } from "@/app/admin/reports-view";

export const metadata: Metadata = {
  title: "Reports",
  description: "Generate and export platform operational reports.",
};

export default function AdminReportsPage() {
  return <AdminReportsView />;
}
