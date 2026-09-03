import { Check, Minus } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const traditional = [
  "Pay the influencer up front",
  "Hope it performs",
  "Track results manually",
  "Fixed fee, fixed risk",
];

const clipMatrix = [
  "Set your budget and rate",
  "Creators compete for reach",
  "Automated view verification",
  "Performance-based spend",
];

export function Comparison() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The difference"
          title={
            <>
              Don&apos;t Pay for Posts.
              <br />
              Pay for <span className="text-accent">Performance.</span>
            </>
          }
          copy="Traditional influencer marketing pays for access. Clip Matrix lets brands allocate spend around verified performance."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-none border border-line bg-surface p-7">
              <p className="text-xs font-semibold tracking-[0.18em] text-faint uppercase">
                Traditional influencer marketing
              </p>
              <ul className="mt-6 space-y-4">
                {traditional.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <Minus className="h-3 w-3 text-faint" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              className={cn(
                "relative h-full rounded-none border border-accent/40 bg-surface p-7",
                "shadow-[0_0_60px_-12px_rgba(163,230,53,0.25)]"
              )}
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                The Clip Matrix marketplace
              </p>
              <ul className="mt-6 space-y-4">
                {clipMatrix.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-fg">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-dim">
                      <Check className="h-3 w-3 text-accent" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
