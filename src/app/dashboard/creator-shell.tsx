"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getCurrentUser } from "@/lib/auth/current-user";
import { clearUserCache } from "@/lib/auth/current-user";

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
      bottomNav={bottomNav}
      userName={user.name}
      userHandle={user.email}
      workspaceLabel="Creator"
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}
