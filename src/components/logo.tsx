import { cn } from "@/lib/utils";

export function MatrixGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
    >
      <circle cx="2.5" cy="2.5" r="1.7" fill="currentColor" />
      <circle cx="8" cy="2.5" r="1.7" fill="currentColor" opacity="0.55" />
      <circle cx="13.5" cy="2.5" r="1.7" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1.7" fill="currentColor" opacity="0.55" />
      <circle cx="8" cy="8" r="1.7" fill="currentColor" />
      <circle cx="13.5" cy="8" r="1.7" fill="currentColor" opacity="0.55" />
      <circle cx="2.5" cy="13.5" r="1.7" fill="currentColor" />
      <circle cx="8" cy="13.5" r="1.7" fill="currentColor" opacity="0.55" />
      <circle cx="13.5" cy="13.5" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  glyphClassName,
}: {
  className?: string;
  glyphClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-1.5 font-heading text-xl font-extrabold tracking-tight",
        className
      )}
    >
      <span className="text-fg">clip</span>
      <span className="text-accent">matrix</span>
      <MatrixGlyph className={cn("mt-0.5 text-accent", glyphClassName)} />
    </span>
  );
}
