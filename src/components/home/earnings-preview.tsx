"use client";

import { useState } from "react";
import { SectionHeading, Section } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/badge";
import { EarningsAreaChart } from "@/components/charts/charts";
import type { AnalyticsRange } from "@/lib/services/types";
import { analyticsService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import {
  formatCompact,
  formatCurrency,
  formatDate,
} from "@/lib/format";

const rows = [
  { campaign: "Nova Podcast", views: 2_400_000, amountMinor: 120_000, status: "Paid" },
  { campaign: "Alpha Arena", views: 840_000, amountMinor: 42_000, status: "Pending" },
  { campaign: "CreatorX x Statline", views: 4_100_000, amountMinor: 205_000, status: "Paid" },
] as const;

const ranges: AnalyticsRange[] = ["7D", "30D", "90D", "ALL"];

export function EarningsPreview() {
  const [range, setRange] = useState<AnalyticsRange>("30D");
  const { data } = useAsync(() => analyticsService.getCreatorEarningsSeries(range), [range]);

  return (
    <Section>
      <SectionHeading
        eyebrow="For creators"
        title="Your Views Become Your Income."
        copy="Every verified view pays. Watch earnings accrue in real time and withdraw weekly."
      />

      <div className="mx-auto mt-14 max-w-5xl rounded-none border border-line bg-surface shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <p className="text-xs tracking-wide text-faint uppercase">Total earnings</p>
            <p className="font-heading text-3xl font-extrabold tabular-nums text-fg">
              $4,820.40
            </p>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent-dim px-4 py-2">
            <p className="text-xs text-muted">This month</p>
            <p className="font-heading text-lg font-bold tabular-nums text-accent">+$1,240.20</p>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="border-b border-line p-4 lg:border-r lg:border-b-0">
            <Tabs
              tabs={ranges.map((r) => ({ id: r, label: r }))}
              active={range}
              onChange={(id) => setRange(id as AnalyticsRange)}
              variant="underline"
              className="mb-2"
            />
            {data ? (
              <EarningsAreaChart data={data} height={260} />
            ) : (
              <div className="h-[260px] animate-pulse rounded-xl bg-white/[0.05]" />
            )}
          </div>

          <div className="p-5">
            <p className="mb-3 text-xs font-semibold tracking-wide text-faint uppercase">
              Recent payouts
            </p>
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <li key={row.campaign} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-fg">{row.campaign}</p>
                    <p className="text-xs text-muted">{formatCompact(row.views)} views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-accent">
                      {formatCurrency(row.amountMinor)}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                </li>
              ))}
            </ul>
            <ButtonLink href="/signup" className="mt-5 w-full">
              Start Earning
            </ButtonLink>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-faint">
        Sample creator dashboard - updated {formatDate(new Date("2026-08-25").toISOString())}
      </p>
    </Section>
  );
}
