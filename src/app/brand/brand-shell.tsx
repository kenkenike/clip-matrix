"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getCurrentUser, clearUserCache } from "@/lib/auth/current-user";

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
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        setUser({ name: u.name, email: u.email });
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  const signOut = () => {
    clearUserCache();
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.replace("/login");
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardShell
      nav={nav}
      userName={user.name}
      userHandle={user.email}
      workspaceLabel="Brand"
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}
