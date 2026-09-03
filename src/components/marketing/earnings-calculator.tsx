"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const presets = [
  { rateMinor: 1_000, label: "$10" },
  { rateMinor: 2_500, label: "$25" },
  { rateMinor: 5_000, label: "$50" },
];

export function EarningsCalculator() {
  const [views, setViews] = useState(500_000);
  const [rate, setRate] = useState(2_500);

  const earnings = (views / 100_000) * (rate / 100);
  const perThousand = views / 1000;

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <label htmlFor="views-slider" className="text-sm font-medium text-muted">
            Monthly views
          </label>
          <p className="font-heading text-3xl font-bold tabular-nums text-fg">
            {formatCompact(views)}
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-surface-alt p-1">
          {presets.map((preset) => (
            <button
              key={preset.rateMinor}
              onClick={() => setRate(preset.rateMinor)}
              aria-pressed={rate === preset.rateMinor}
              className={cn(
                "cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                rate === preset.rateMinor
                  ? "bg-accent-dim text-accent shadow-[inset_0_0_0_1px_rgba(163,230,53,0.35)]"
                  : "text-muted hover:text-fg"
              )}
            >
              {preset.label} / 100K
            </button>
          ))}
        </div>
      </div>

      <input
        id="views-slider"
        type="range"
        min={10_000}
        max={10_000_000}
        step={10_000}
        value={views}
        onChange={(e) => setViews(Number(e.target.value))}
        className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#ebc594]"
        style={{
          background: `linear-gradient(to right, #ebc594 0%, #ebc594 ${(views / 10_000_000) * 100}%, rgba(255,255,255,0.1) ${(views / 10_000_000) * 100}%)`,
        }}
      />
      <div className="mt-2 flex justify-between text-xs text-faint">
        <span>10K</span>
        <span>10M</span>
      </div>

      <div className="mt-8 rounded-xl border border-accent/30 bg-accent-dim px-6 py-5 text-center">
        <p className="text-xs tracking-wide text-muted uppercase">Estimated earnings</p>
        <p className="mt-1 font-heading text-4xl font-extrabold tabular-nums text-accent sm:text-5xl">
          {formatCurrency(Math.round(earnings * 100), { cents: false })}
        </p>
        <p className="mt-2 text-xs text-faint">
          {perThousand.toLocaleString([], { maximumFractionDigits: 0 })}K qualifying views at{" "}
          {formatCurrency(rate, { cents: false })} per 100K
        </p>
      </div>
    </Card>
  );
}
