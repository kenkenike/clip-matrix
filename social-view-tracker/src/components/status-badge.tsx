import { Badge } from "@/components/ui/badge";

export type TrackStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "UNAVAILABLE"
  | "RATE_LIMITED";

const map: Record<
  TrackStatus,
  { label: string; variant: "default" | "success" | "danger" | "warning" | "muted" }
> = {
  PROCESSING: { label: "Collecting", variant: "warning" },
  COMPLETED: { label: "Complete", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  UNAVAILABLE: { label: "Unavailable", variant: "muted" },
  RATE_LIMITED: { label: "Rate limited", variant: "warning" },
};

export function StatusBadge({ status }: { status: TrackStatus }) {
  const item = map[status] ?? { label: status, variant: "muted" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}