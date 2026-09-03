import type { ReactNode } from "react";
import { CreatorShell } from "@/app/dashboard/creator-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <CreatorShell>{children}</CreatorShell>;
}
