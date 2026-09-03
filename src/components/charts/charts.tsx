"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  label: string;
  value: number;
}

const axisProps = {
  stroke: "transparent",
  tick: { fill: "#71717a", fontSize: 11 },
  tickLine: false,
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      backgroundColor: "#1c1c1c",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      fontSize: 12,
      color: "#ffffff",
    },
    labelStyle: { color: "#a1a1aa", marginBottom: 4 },
    cursor: { stroke: "rgba(163,230,53,0.3)" },
  };
}

export function EarningsAreaChart({ data, height = 280 }: { data: ChartPoint[]; height?: number }) {
  const gradientId = useId();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ebc594" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ebc594" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} width={44} tickFormatter={(v: number) => `$${compactTick(v)}`} />
        <RTooltip {...tooltipStyle()} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Earnings"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ebc594"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, fill: "#ebc594", stroke: "#0a0a0a" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniAreaChart({ data, height = 120 }: { data: ChartPoint[]; height?: number }) {
  const gradientId = useId();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ebc594" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ebc594" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={[0, "auto"]} />
        <Area type="monotone" dataKey="value" stroke="#ebc594" strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PerformanceBarChart({
  data,
  height = 280,
}: {
  data: ChartPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={16} />
        <YAxis {...axisProps} width={48} tickFormatter={(v: number) => compactTick(v)} />
        <RTooltip {...tooltipStyle()} formatter={(v) => [Number(v).toLocaleString(), "Views"]} />
        <Bar dataKey="value" fill="#ebc594" radius={[5, 5, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MetricLineChart({
  data,
  height = 300,
  valueLabel = "Value",
  currency = false,
}: {
  data: ChartPoint[];
  height?: number;
  valueLabel?: string;
  currency?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis
          {...axisProps}
          width={52}
          tickFormatter={(v: number) =>
            currency ? `$${compactTick(v)}` : compactTick(v)
          }
        />
        <RTooltip
          {...tooltipStyle()}
          formatter={(v) => [
            currency ? `$${Number(v).toLocaleString()}` : Number(v).toLocaleString(),
            valueLabel,
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#ebc594"
          strokeWidth={2.2}
          dot={false}
          activeDot={{ r: 4, fill: "#ebc594", stroke: "#0a0a0a" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function compactTick(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(value));
}
