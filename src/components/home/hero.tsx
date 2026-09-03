"use client";

import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { InitialTile } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCountUp, useInView } from "@/lib/hooks";
import { formatCompact, formatCurrency } from "@/lib/format";

const creatorCards = [
  { name: "Maya K.", views: 128_000, earnedMinor: 3_200 },
  { name: "Dev P.", views: 842_000, earnedMinor: 21_050 },
  { name: "Lena R.", views: 2_400_000, earnedMinor: 60_000 },
];

const trustChips = [
  "Creators worldwide",
  "Performance-based",
  "Verified views",
  "Built for short-form",
];

export function Hero() {
  return (
    <section className="radial-glow relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:pt-28 lg:pb-32">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex items-center rounded-full border border-accent/30 bg-accent-dim px-3.5 py-1.5 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            The performance creator network
          </p>
          <h1 className="hero-blur-fade font-heading text-5xl leading-[1.02] font-semibold tracking-tight text-fg sm:text-6xl lg:text-7xl">
            Turn Content Into{" "}
            <span className="text-glow-accent text-accent">Distribution.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Connect your brand with creators who turn long-form content into
            high-performing short-form videos across every major social platform.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <ButtonLink href="/contact" size="lg">
              Launch a Campaign
              <Arrow aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/signup" variant="secondary" size="lg">
              Start Earning
              <Arrow aria-hidden="true" />
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5">
            {trustChips.map((chip) => (
              <li key={chip} className="inline-flex items-center gap-2 text-sm text-muted">
                <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 ${className ?? ""}`}
    >
      <path
        d="M2 8h11M9 3.5 13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const budget = useCountUp(10_000, inView);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-none border border-line bg-surface/90 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-widest text-faint uppercase">Campaign</p>
          <Badge tone="success">Active</Badge>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <InitialTile label="Nova Podcast" size="md" />
          <div>
            <p className="font-heading text-base font-bold text-fg">Nova Podcast</p>
            <p className="text-xs text-muted">$25 / 100K views</p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between rounded-xl border border-line bg-surface-alt px-4 py-3">
          <div>
            <p className="text-[10px] tracking-wide text-faint uppercase">Budget</p>
            <p className="font-heading text-2xl font-bold tabular-nums text-fg">
              ${Math.round(budget).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-wide text-faint uppercase">Creators</p>
            <p className="font-heading text-2xl font-bold tabular-nums text-accent">214</p>
          </div>
        </div>
      </div>

      <div className="relative mt-1 ml-[14%] space-y-1">
        {creatorCards.map((creator) => (
          <CreatorFlowRow key={creator.name} {...creator} animate={inView} />
        ))}
      </div>

      <div
        className="pointer-events-none absolute -inset-x-8 -bottom-10 h-40"
        style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.14), transparent)" }}
        aria-hidden="true"
      />
    </div>
  );
}

function CreatorFlowRow({
  name,
  views,
  earnedMinor,
  animate,
}: {
  name: string;
  views: number;
  earnedMinor: number;
  animate: boolean;
}) {
  const animatedViews = useCountUp(views, animate);
  const animatedEarned = useCountUp(earnedMinor / 100, animate);

  return (
    <>
      <div className="flex h-4 justify-center" aria-hidden="true">
        <div className="h-full w-px bg-gradient-to-b from-accent/50 to-accent/15" />
      </div>
      <div className="card-hover-lift flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <InitialTile label={name} size="sm" />
          <span className="text-sm font-medium text-fg">{name}</span>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-heading text-sm font-bold tabular-nums text-fg">
              {formatCompact(Math.round(animatedViews))}
            </p>
            <p className="text-[10px] text-faint">views</p>
          </div>
          <div>
            <p className="font-heading text-sm font-bold tabular-nums text-accent">
              {formatCurrency(Math.round(animatedEarned * 100), { cents: false })}
            </p>
            <p className="text-[10px] text-faint">earned</p>
          </div>
        </div>
      </div>
    </>
  );
}
