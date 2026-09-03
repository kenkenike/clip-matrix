import type { Metadata } from "next";
import { AccountsView } from "@/app/dashboard/accounts/accounts-view";

export const metadata: Metadata = {
  title: "Connected Accounts",
  description: "Connect your social accounts so Clip Matrix can verify views automatically.",
};

export default function AccountsPage() {
  return <AccountsView />;
}
