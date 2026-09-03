"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = "pill",
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-1 overflow-x-auto border-b border-line", className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-fg"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface-alt p-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all sm:text-sm",
            active === tab.id
              ? "bg-accent-dim text-accent shadow-[inset_0_0_0_1px_rgba(163,230,53,0.35)]"
              : "text-muted hover:text-fg"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
