"use client";

import {
  LayoutGrid,
  Megaphone,
  Users,
  FolderOpen,
  BarChart3,
  CreditCard,
  UsersRound,
  Settings,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";

const nav = [
  { href: "/brand", label: "Overview", icon: LayoutGrid },
  { href: "/brand/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/brand/creators", label: "Creators", icon: Users },
  { href: "/brand/content", label: "Content", icon: FolderOpen },
  { href: "/brand/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/brand/billing", label: "Billing", icon: CreditCard },
  { href: "/brand/team", label: "Team", icon: UsersRound },
  { href: "/brand/settings", label: "Settings", icon: Settings },
];

export function BrandShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={nav}
      userName="Jordan Blake"
      userHandle="@northbeam"
      workspaceLabel="Brand"
    >
      {children}
    </DashboardShell>
  );
}
