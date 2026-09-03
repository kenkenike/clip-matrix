"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Megaphone, HelpCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { authService } from "@/lib/services";
import type { SessionUser } from "@/lib/services/auth";

const nav = [
  { href: "/mod", label: "Submissions", icon: ClipboardCheck },
  { href: "/mod/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/mod/help", label: "Help", icon: HelpCircle },
];

function ModGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const current = authService.getSession();
    if (current && (current.role === "moderator" || current.role === "admin")) {
      setSession(current);
    } else {
      router.replace("/login");
    }
    setChecked(true);
  }, [router]);

  const signOut = () => {
    authService.signOut();
    router.replace("/login");
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
      workspaceLabel="Moderation"
      accentBadge="MOD"
      dark
      onSignOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}

export function ModShell({ children }: { children: ReactNode }) {
  return <ModGate>{children}</ModGate>;
}
