import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "danger" | "muted" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/15 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
  outline: "border bg-transparent text-foreground",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant };

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}