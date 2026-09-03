const UNITS = [
  { value: 1e12, label: "T" },
  { value: 1e9, label: "B" },
  { value: 1e6, label: "M" },
  { value: 1e3, label: "K" },
];

export function formatNumber(value: number | bigint | null | undefined): string {
  if (value === null || value === undefined) return "Unavailable";
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n)) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCompact(value: number | bigint | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const scaled = n / unit.value;
      return `${scaled >= 100 ? Math.round(scaled) : scaled.toFixed(1)}${unit.label}`;
    }
  }
  return String(Math.round(n));
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function clampInteger(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}