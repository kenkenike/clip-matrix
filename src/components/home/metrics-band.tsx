"use client";

import type { NetworkMetrics } from "@/lib/services/types";
import { analyticsService } from "@/lib/services";
import { useAsync, useCountUp, useInView } from "@/lib/hooks";
import { ErrorState, Skeleton } from "@/components/ui/skeleton";

export function MetricsBand() {
  const { data, loading, error, retry } = useAsync<NetworkMetrics>(
    () => analyticsService.getNetworkMetrics(),
    []
  );
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <section ref={ref} className="border-b border-line py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3 text-center lg:text-left">
                <Skeleton className="mx-auto h-9 w-28 lg:mx-0" />
                <Skeleton className="mx-auto h-4 w-24 lg:mx-0" />
              </div>
            ))}
          </div>
        )}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            <Metric
              active={inView}
              value={data.creatorEarningsMinor / 100}
              prefix="$"
              suffix="+"
              compact
              label="Creator earnings"
            />
            <Metric
              active={inView}
              value={data.creators}
              suffix="+"
              compact
              label="Creators"
            />
            <Metric
              active={inView}
              value={data.campaigns}
              suffix="+"
              compact
              label="Campaigns launched"
            />
            <Metric
              active={inView}
              value={data.viewsTracked}
              suffix=""
              compact
              label="Views tracked"
            />
            <Metric
              active={inView}
              value={data.avgEngagementPct}
              suffix="%"
              decimals={1}
              label="Avg engagement"
            />
          </dl>
        )}
      </div>
    </section>
  );
}

function Metric({
  value,
  prefix,
  suffix,
  label,
  compact,
  decimals,
  active,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  compact?: boolean;
  decimals?: number;
  active: boolean;
}) {
  const animated = useCountUp(value, active);
  let display: string;
  if (compact) {
    display = compactFormat(animated);
  } else if (decimals !== undefined) {
    display = animated.toFixed(decimals);
  } else {
    display = Math.round(animated).toLocaleString();
  }

  return (
    <div>
      <dt className="order-2 mt-1.5 text-sm text-muted">{label}</dt>
      <dd className="order-1 font-heading text-3xl font-extrabold tracking-tight tabular-nums text-fg sm:text-4xl">
        {prefix}
        {display}
        {suffix && <span className="text-accent">{suffix}</span>}
      </dd>
    </div>
  );
}

function compactFormat(value: number): string {
  if (value >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trim(value / 1_000)}K`;
  return String(Math.round(value));
}

function trim(value: number): string {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
