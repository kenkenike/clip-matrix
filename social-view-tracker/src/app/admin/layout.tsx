import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Admin" };

/**
 * Admin area gate: only ADMIN users may open /admin/*. Everyone else is sent
 * back to the dashboard (or login when not authenticated).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/app");

  return (
    <AppShell userName={user.name ?? "User"} userEmail={user.email ?? ""} isAdmin>
      {children}
    </AppShell>
  );
}