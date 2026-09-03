import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-white/5 text-muted",
  accent: "border-accent/40 bg-accent-dim text-accent",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  danger: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusTones: Record<string, Tone> = {
  ACTIVE: "success",
  ENDING_SOON: "warning",
  DRAFT: "neutral",
  PAUSED: "warning",
  COMPLETED: "info",
  pending: "neutral",
  under_review: "info",
  approved: "success",
  rejected: "danger",
  flagged: "warning",
  paid: "accent",
  processing: "info",
  Paid: "accent",
  Pending: "warning",
  Processing: "info",
  Rejected: "danger",
  not_connected: "neutral",
  connecting: "info",
  verified: "success",
  disconnected: "danger",
  active: "success",
  suspended: "danger",
  banned: "danger",
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ENDING_SOON: "Ending soon",
  DRAFT: "Draft",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  under_review: "Under review",
  not_connected: "Not connected",
};

function humanize(status: string): string {
  return (
    statusLabels[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTones[status] ?? "neutral"} className={className}>
      <span
        aria-hidden="true"
        className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full bg-current"
      />
      {humanize(status)}
    </Badge>
  );
}
