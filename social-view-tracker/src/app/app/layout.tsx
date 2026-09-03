import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell userName={user.name ?? "User"} userEmail={user.email ?? ""} isAdmin={user.role === "ADMIN"}>
      {children}
    </AppShell>
  );
}