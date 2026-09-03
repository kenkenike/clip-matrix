/**
 * Pure domain logic for the Instagram Reels module — no I/O so it can be
 * unit-tested in isolation.
 *
 * Covers: views-gained math, growth %, provider-call classification into the
 * tracking-status vocabulary, metric-correction handling, and anti-fraud/delta
 * analysis.
 */

export type ReelTrackingStatus =
  | "pending_connection"
  | "pending_media_resolution"
  | "active"
  | "paused"
  | "metric_unavailable"
  | "failed"
  | "deleted"
  | "completed";

export type MetricsErrorCategory =
  | "oauth"
  | "permission"
  | "media_resolution"
  | "metric_availability"
  | "rate_limit"
  | "temporary"
  | "media_deleted"
  | "network";

export type MetricsCallLike = {
  ok: boolean;
  category?: MetricsErrorCategory;
  errorMessage?: string;
  data?: { views?: number | null };
};

export type ProviderClassification = {
  /** The tracking status to persist on the reel. */
  status: ReelTrackingStatus;
  /** The fresh view count (null when not obtainable). */
  views: number | null;
  /** Human-readable message (error or explanatory note). */
  message?: string;
  /** Why metrics were unavailable, for the event log. */
  reason?: string | null;
};

const TRANSIENT_CATEGORIES: ReadonlySet<MetricsErrorCategory> = new Set([
  "rate_limit",
  "temporary",
  "network",
]);

/**
 * Translates a provider metrics call into a reel tracking status + views.
 * The app never fabricates counts: a call that did not yield a usable view
 * count becomes metric_unavailable, failed, deleted, or pending_media_resolution
 * based on the official API's own error.
 */
export function classifyMetricsCall(call: MetricsCallLike): ProviderClassification {
  const views = typeof call.data?.views === "number" ? Math.round(call.data.views) : null;

  if (call.ok) {
    if (views === null) {
      return {
        status: "metric_unavailable",
        views: null,
        message:
          "The authorized API does not provide views for this media.",
        reason: "VIEW_METRIC_NOT_AVAILABLE",
      };
    }
    return { status: "active", views };
  }

  const category = call.category ?? "temporary";
  const error = call.errorMessage ?? "Instagram API error.";

  switch (category) {
    case "oauth":
      return {
        status: "failed",
        views: null,
        message: "Instagram API authorization failed. Reconnect your Instagram account.",
        reason: "oauth",
      };
    case "permission":
      return {
        status: "failed",
        views: null,
        message:
          "The connected Instagram account lacks permission for the requested metric (instagram_manage_insights).",
        reason: "permission",
      };
    case "media_resolution":
      return {
        status: "pending_media_resolution",
        views: null,
        message: error,
        reason: "media_resolution",
      };
    case "metric_availability":
      return {
        status: "metric_unavailable",
        views: null,
        message: "The authorized API does not provide views for this media.",
        reason: "VIEW_METRIC_NOT_AVAILABLE",
      };
    case "media_deleted":
      return {
        status: "deleted",
        views: null,
        message: "This reel is no longer available on Instagram.",
        reason: "deleted",
      };
    case "rate_limit":
      return {
        status: "failed",
        views: null,
        message: "Instagram API rate limit exceeded. The system will retry.",
        reason: "rate_limit",
      };
    case "temporary":
    case "network":
    default:
      return {
        status: "failed",
        views: null,
        message: error,
        reason: TRANSIENT_CATEGORIES.has(category) ? category : "temporary",
      };
  }
}

export function isTransientClassification(classification: ProviderClassification): boolean {
  return (
    classification.status === "failed" &&
    (classification.reason === "rate_limit" ||
      classification.reason === "temporary" ||
      classification.reason === "network")
  );
}

export const VIEW_JUMP_THRESHOLD_PCT = clampRatio(
  process.env.REEL_JUMP_THRESHOLD_PCT,
  50,
);
export const VIEW_JUMP_THRESHOLD_ABSOLUTE = clampNumber(
  process.env.REEL_JUMP_THRESHOLD_ABSOLUTE,
  100_000,
);
export const REPEATED_RESPONSE_THRESHOLD = clampNumber(
  process.env.REEL_REPEATED_RESPONSE_THRESHOLD,
  3,
);

function clampNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clampRatio(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * never negative: corrections clamp to 0 and are flagged for review.
 * `initialViews` may be null before the first successful official metric.
 */
export function computeViewsGained(
  initialViews: number | null,
  currentViews: number,
): { gained: number; correction: boolean } {
  const base = initialViews ?? currentViews;
  const gained = currentViews - base;
  if (gained >= 0) return { gained, correction: false };
  return { gained: 0, correction: true };
}

/** Growth as a percentage of the starting value, or null when unknown. */
export function growthPercent(
  initialViews: number | null,
  currentViews: number,
): number | null {
  if (initialViews === null || initialViews <= 0 || !Number.isFinite(currentViews)) {
    return null;
  }
  return ((currentViews - initialViews) / initialViews) * 100;
}

export type DeltaAnalysis = {
  eventType: "normal" | "metric_correction" | "suspicious_jump" | "repeated_response";
  flagged: boolean;
  note?: string;
  consecutiveIdentical: number;
};

/**
 * Flags unusual events for admin review without calling legitimate viral
 * growth fraud: corrections (negative deltas), extreme jumps, and repeated
 * identical responses are all just marked, never auto-reversed.
 */
export function analyzeDelta(
  previousViews: number | null | undefined,
  currentViews: number | null,
  consecutiveIdentical: number,
): DeltaAnalysis {
  if (currentViews === null || previousViews === null || previousViews === undefined) {
    return { eventType: "normal", flagged: false, consecutiveIdentical: 0 };
  }
  if (currentViews < previousViews) {
    return {
      eventType: "metric_correction",
      flagged: true,
      note: `Instagram reported ${currentViews.toLocaleString()} views, down ${(previousViews - currentViews).toLocaleString()} from a prior value of ${previousViews.toLocaleString()}. Recorded as a metric correction.`,
      consecutiveIdentical: 0,
    };
  }
  if (currentViews === previousViews) {
    const next = consecutiveIdentical + 1;
    if (next >= REPEATED_RESPONSE_THRESHOLD) {
      return {
        eventType: "repeated_response",
        flagged: true,
        note: `${next} consecutive checks returned the same value (${currentViews.toLocaleString()}).`,
        consecutiveIdentical: next,
      };
    }
    return { eventType: "normal", flagged: false, consecutiveIdentical: next };
  }

  const gained = currentViews - previousViews;
  const pct = previousViews > 0 ? (gained / previousViews) * 100 : Number.POSITIVE_INFINITY;
  if (gained > VIEW_JUMP_THRESHOLD_ABSOLUTE && pct > VIEW_JUMP_THRESHOLD_PCT) {
    return {
      eventType: "suspicious_jump",
      flagged: true,
      note: `Jump of +${gained.toLocaleString()} views (+${pct.toFixed(1)}%) since the previous check. Flagged for review; not treated as fraud automatically.`,
      consecutiveIdentical: 0,
    };
  }
  return { eventType: "normal", flagged: false, consecutiveIdentical: 0 };
}