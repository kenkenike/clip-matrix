import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  copy,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("radial-glow relative overflow-hidden border-b border-line", className)}>
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        <div className="animate-fade-up">
          {eyebrow && (
            <p className="mb-5 inline-flex items-center rounded-full border border-accent/30 bg-accent-dim px-3.5 py-1.5 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {copy && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">{copy}</p>
          )}
          {actions && <div className="mt-9 flex flex-wrap justify-center gap-3.5">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
