"use client";

import {
  LayoutGrid,
  Compass,
  Scissors,
  Link2,
  Wallet,
  CreditCard,
  Settings,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Compass },
  { href: "/dashboard/clips", label: "My Clips", icon: Scissors },
  { href: "/dashboard/accounts", label: "Accounts", icon: Link2 },
  { href: "/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const bottomNav = [
  nav[1],
  nav[4],
  { href: "/dashboard/clips", label: "Submit", icon: Scissors },
];

export function CreatorShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={nav}
      bottomNav={bottomNav}
      userName="Alex Rivera"
      userHandle="@alexclips"
      workspaceLabel="Creator"
    >
      {children}
    </DashboardShell>
  );
}
