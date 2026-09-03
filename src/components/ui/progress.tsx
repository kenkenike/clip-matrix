import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  className,
  tone = "accent",
  label,
}: {
  value: number;
  max: number;
  className?: string;
  tone?: "accent" | "warning" | "danger";
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tones = {
    accent: "bg-accent",
    warning: "bg-amber-400",
    danger: "bg-red-400",
  } as const;

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-xs text-muted">{label}</p>}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-700", tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
