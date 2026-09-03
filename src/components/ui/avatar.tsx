import { hueFromString, initials as toInitials, cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
  size = "md",
}: {
  name: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const hue = hueFromString(name);
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-heading font-bold",
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `hsl(${hue} 45% 18%)`,
        borderColor: `hsl(${hue} 60% 30%)`,
        color: `hsl(${hue} 80% 72%)`,
      }}
    >
      {toInitials(name)}
    </span>
  );
}

export function InitialTile({
  label,
  size = "md",
  className,
}: {
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = (label.trim()[0] ?? "?").toUpperCase();
  const sizes = {
    sm: "h-9 w-9 rounded-lg text-sm",
    md: "h-12 w-12 rounded-xl text-lg",
    lg: "h-16 w-16 rounded-none text-2xl",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-accent/25 bg-accent-dim font-heading font-extrabold text-accent",
        sizes[size],
        className
      )}
    >
      {initial}
    </span>
  );
}
