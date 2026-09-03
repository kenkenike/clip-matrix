import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-none border border-dashed border-line-strong bg-surface-alt px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dim text-accent">
          {typeof Icon === "function" ? <Icon className="h-5 w-5" /> : Icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-fg">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
