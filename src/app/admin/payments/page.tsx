import type { Metadata } from "next";
import { AdminPaymentsView } from "@/app/admin/payments-view";

export const metadata: Metadata = {
  title: "Payments",
  description: "Creator payout queue with release controls and method breakdown.",
};

export default function AdminPaymentsPage() {
  return <AdminPaymentsView />;
}
