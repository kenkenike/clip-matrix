"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Select, type SelectOption } from "@/components/ui/inputs";

export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap items-center gap-2.5", className)}>{children}</div>;
}

export function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
  className,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  return (
    <Select
      ariaLabel={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      className={cn("w-44", className)}
    />
  );
}
