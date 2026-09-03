import type { ReactNode } from "react";
import { BrandShell } from "@/app/brand/brand-shell";

export default function BrandLayout({ children }: { children: ReactNode }) {
  return <BrandShell>{children}</BrandShell>;
}
