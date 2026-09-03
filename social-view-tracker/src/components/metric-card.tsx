import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  accent?: "primary" | "warning" | "danger" | "muted";
};

const accentDot: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-destructive",
  muted: "bg-muted-foreground",
};

export function MetricCard({ label, value, sub, icon: Icon, accent = "primary" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-mono-nums mt-1 truncate text-2xl font-semibold leading-none">{value}</p>
          {sub ? <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={cn("h-2 w-2 rounded-full", accentDot[accent])} />
          {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
        </div>
      </CardContent>
    </Card>
  );
}