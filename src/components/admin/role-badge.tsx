import { Badge } from "@/components/ui/badge";
import type { AdminRole } from "@/lib/services/types";

const roleTones: Record<AdminRole, "info" | "accent" | "warning" | "danger"> = {
  creator: "info",
  brand: "accent",
  moderator: "warning",
  admin: "danger",
};

export function RoleBadge({ role }: { role: AdminRole }) {
  return <Badge tone={roleTones[role]}>{role}</Badge>;
}
