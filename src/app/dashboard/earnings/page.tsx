import type { Metadata } from "next";
import { EarningsView } from "@/app/dashboard/earnings/earnings-view";

export const metadata: Metadata = {
  title: "Earnings",
  description: "Your Clip Matrix earnings: available balance, pending payouts, and full history.",
};

export default function EarningsPage() {
  return <EarningsView />;
}
