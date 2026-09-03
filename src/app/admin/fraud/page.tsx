import type { Metadata } from "next";
import { AdminFraudView } from "@/app/admin/fraud-view";

export const metadata: Metadata = {
  title: "Fraud Detection",
  description: "Internal fraud risk signals and scoring for clip submissions.",
};

export default function AdminFraudPage() {
  return <AdminFraudView />;
}
