import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-3xl font-bold tracking-tight text-fg sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {copy && (
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{copy}</p>
      )}
    </div>
  );
}

export function Section({
  children,
  className,
  alt = false,
}: {
  children: ReactNode;
  className?: string;
  alt?: boolean;
}) {
  return (
    <section className={cn("py-20 sm:py-24", alt && "bg-surface-alt", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
