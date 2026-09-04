"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Megaphone,
  ClipboardCheck,
  CreditCard,
  ShieldAlert,
  FileBarChart,
  Settings,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser, clearUserCache } from "@/lib/auth/current-user";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/fraud", label: "Fraud Detection", icon: ShieldAlert },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u && (u.role === "admin" || u.role === "moderator")) {
        setSession({ name: u.name, email: u.email });
      } else {
        router.replace("/login");
      }
      setChecked(true);
    });
  }, [router]);

  const signOut = () => {
    clearUserCache();
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      router.replace("/login");
    });
  };

  if (!checked || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse text-sm text-muted">Verifying access...</p>
      </div>
    );
  }

  return (
    <DashboardShell
      nav={nav}
      userName={session.name}
      userHandle={session.email}
      workspaceLabel="Clip Matrix HQ"
      accentBadge="ADMIN"
      dark
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
