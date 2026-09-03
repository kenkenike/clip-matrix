import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-95 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs whitespace-nowrap text-fg opacity-0 shadow-xl transition-all duration-150 group-hover/tt:scale-100 group-hover/tt:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
