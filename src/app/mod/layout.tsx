import type { ReactNode } from "react";
import { ModShell } from "@/app/mod/mod-shell";

export default function ModLayout({ children }: { children: ReactNode }) {
  return <ModShell>{children}</ModShell>;
}
