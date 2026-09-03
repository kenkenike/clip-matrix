import type { Metadata } from "next";
import { PaymentsView } from "@/app/dashboard/payments/payments-view";

export const metadata: Metadata = {
  title: "Payments",
  description: "Manage payout methods and withdrawal settings for your Clip Matrix earnings.",
};

export default function PaymentsPage() {
  return <PaymentsView />;
}
