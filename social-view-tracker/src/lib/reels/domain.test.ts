import { describe, expect, it } from "vitest";
import {
  analyzeDelta,
  classifyMetricsCall,
  computeViewsGained,
  growthPercent,
  REPEATED_RESPONSE_THRESHOLD,
} from "./domain";

describe("computeViewsGained", () => {
  it("computes positive growth", () => {
    expect(computeViewsGained(10_000, 25_000)).toEqual({ gained: 15_000, correction: false });
  });

  it("clamps negative growth to zero and flags a correction", () => {
    expect(computeViewsGained(25_000, 10_000)).toEqual({ gained: 0, correction: true });
  });

  it("handles equal values", () => {
    expect(computeViewsGained(10_000, 10_000)).toEqual({ gained: 0, correction: false });
  });

  it("bases growth on the first official metric when initialViews is null", () => {
    expect(computeViewsGained(null, 50_000)).toEqual({ gained: 0, correction: false });
  });
});

describe("growthPercent", () => {
  it("computes growth percentage", () => {
    expect(growthPercent(10_000, 50_000)).toBe(400);
  });

  it("returns null when the initial value is unknown, zero, or negative", () => {
    expect(growthPercent(null, 50_000)).toBeNull();
    expect(growthPercent(0, 50_000)).toBeNull();
    expect(growthPercent(-5, 50_000)).toBeNull();
  });
});

describe("classifyMetricsCall — never fabricates views", () => {
  it("marks a reel active on a successful official view count", () => {
    expect(classifyMetricsCall({ ok: true, data: { views: 125_000 } })).toEqual({
      status: "active",
      views: 125_000,
    });
  });

  it("records metric_unavailable when the API succeeded but gave no views", () => {
    const result = classifyMetricsCall({ ok: true, data: { views: null } });
    expect(result.status).toBe("metric_unavailable");
    expect(result.views).toBeNull();
    expect(result.reason).toBe("VIEW_METRIC_NOT_AVAILABLE");
  });

  it("maps an insights permission failure to metric_unavailable", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "metric_availability",
      errorMessage: "insights not available",
    });
    expect(result.status).toBe("metric_unavailable");
    expect(result.views).toBeNull();
    expect(result.reason).toBe("VIEW_METRIC_NOT_AVAILABLE");
  });

  it("maps an unreachable shortcode to pending_media_resolution", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "media_resolution",
      errorMessage: "Could not resolve shortcode to a media id.",
    });
    expect(result.status).toBe("pending_media_resolution");
    expect(result.reason).toBe("media_resolution");
  });

  it("maps deleted media to deleted", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "media_deleted",
      errorMessage: "Media removed on Instagram.",
    });
    expect(result.status).toBe("deleted");
  });

  it("maps OAuth failures to failed so the user reconnects", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "oauth",
      errorMessage: "Session has expired.",
    });
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("oauth");
  });

  it("maps rate limits to failed but transient (retryable)", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "rate_limit",
      errorMessage: "Rate limit exceeded.",
    });
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("rate_limit");
    expect(classifyMetricsCall({ ok: false, category: "rate_limit", errorMessage: "" }).status).toBe("failed");
  });

  it("maps generic network/timeout failures to failed/transient", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "temporary",
      errorMessage: "Timeout after 25s.",
    });
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("temporary");
    expect(classifyMetricsCall({ ok: false, category: "network", errorMessage: "ENOTFOUND" }).reason).toBe("network");
  });

  it("maps a missing OAuth scope to failed/permission", () => {
    const result = classifyMetricsCall({
      ok: false,
      category: "permission",
      errorMessage: "needs instagram_manage_insights",
    });
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("permission");
  });
});

describe("analyzeDelta — anti-fraud flags, never auto-actioned", () => {
  it("flags a repeated identical response after the threshold", () => {
    let identical = 0;
    for (let i = 1; i < REPEATED_RESPONSE_THRESHOLD; i++) {
      const r = analyzeDelta(5_000, 5_000, identical);
      identical = r.consecutiveIdentical;
      expect(r.flagged).toBe(false);
      expect(r.eventType).toBe("normal");
    }
    const flagged = analyzeDelta(5_000, 5_000, identical);
    expect(flagged.eventType).toBe("repeated_response");
    expect(flagged.flagged).toBe(true);
  });

  it("records negative deltas as metric corrections, not fraud", () => {
    const r = analyzeDelta(12_500, 10_000, 0);
    expect(r.eventType).toBe("metric_correction");
    expect(r.flagged).toBe(true);
  });

  it("flags suspiciously large jumps for review", () => {
    const r = analyzeDelta(1_000, 200_000, 0);
    expect(r.eventType).toBe("suspicious_jump");
    expect(r.flagged).toBe(true);
  });

  it("leaves legitimate growth unflagged", () => {
    const r = analyzeDelta(1_000_000, 1_050_000, 0);
    expect(r.eventType).toBe("normal");
    expect(r.flagged).toBe(false);
  });

  it("treats an unknown previous value as a baseline", () => {
    const r = analyzeDelta(null, 10_000, 0);
    expect(r.eventType).toBe("normal");
    expect(r.flagged).toBe(false);
  });
});