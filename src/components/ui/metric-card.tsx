"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useCountUp, useInView } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: number | string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: ReactNode;
  prefix?: string;
  suffix?: string;
  countUp?: boolean;
  compact?: boolean;
  sub?: string;
  centered?: boolean;
  className?: string;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${trimNum(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${trimNum(value / 1_000_000)}M`;
  if (value >= 10_000) return `${trimNum(value / 1_000)}K`;
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function trimNum(value: number): string {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function MetricCard({
  label,
  value,
  delta,
  deltaPositive = true,
  icon,
  prefix,
  suffix,
  countUp = false,
  compact = false,
  sub,
  centered = false,
  className,
}: MetricCardProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const numeric = typeof value === "number" ? value : null;
  const animated = useCountUp(numeric ?? 0, inView && numeric !== null && countUp);

  let display: ReactNode = value;
  if (numeric !== null) {
    const shown = countUp ? animated : numeric;
    display = compact
      ? formatCompactNumber(shown)
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: shown % 1 !== 0 ? 1 : 0 }).format(shown);
  }

  return (
    <div
      ref={ref}
      className={cn(
        "card-hover-lift rounded-none border border-line bg-surface p-5",
        className
      )}
    >
      <div className={cn("flex items-center gap-2", centered ? "justify-center" : "justify-between")}>
        {centered && icon && <span className="text-accent">{icon}</span>}
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
        {!centered && icon && <span className="text-accent">{icon}</span>}
      </div>
      <div className={cn("mt-2 flex items-baseline gap-1.5", centered && "justify-center")}>
        {prefix && <span className="font-heading text-xl font-bold text-fg sm:text-2xl">{prefix}</span>}
        <span className="font-heading text-2xl font-bold tracking-tight text-fg tabular-nums sm:text-3xl">
          {display}
        </span>
        {suffix && <span className="font-heading text-lg font-bold text-muted">{suffix}</span>}
      </div>
      <div className={cn("mt-1.5 flex items-center gap-2 text-xs", centered && "justify-center")}>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              deltaPositive ? "text-accent" : "text-red-400"
            )}
          >
            {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
        {sub && <span className="text-faint">{sub}</span>}
      </div>
    </div>
  );
}
