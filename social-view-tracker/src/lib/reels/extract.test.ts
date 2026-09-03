import { describe, expect, it } from "vitest";
import { extractInstagramReelId, isInstagramUrl, normalizeReelUrl } from "./extract";

describe("extractInstagramReelId", () => {
  it("extracts a plain shortcode", () => {
    expect(extractInstagramReelId("https://instagram.com/reel/ABC123/")).toEqual({
      ok: true,
      reelId: "ABC123",
      normalizedUrl: "https://www.instagram.com/reel/ABC123/",
    });
  });

  it("extracts from a www URL", () => {
    expect(extractInstagramReelId("https://www.instagram.com/reel/C123456789/")).toMatchObject({
      ok: true,
      reelId: "C123456789",
    });
  });

  it("strips query parameters (igsh) and keeps only the identifier", () => {
    const result = extractInstagramReelId("https://www.instagram.com/reel/C123456789/?igsh=abc");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reelId).toBe("C123456789");
      expect(result.normalizedUrl).toBe("https://www.instagram.com/reel/C123456789/");
      expect(result.normalizedUrl).not.toContain("igsh");
      expect(result.normalizedUrl).not.toContain("?");
    }
  });

  it("rejects non-Instagram URLs", () => {
    expect(extractInstagramReelId("https://www.youtube.com/watch?v=abc")).toEqual({
      ok: false,
      error: "NOT_INSTAGRAM",
    });
  });

  it("rejects Instagram URLs that are not media pages", () => {
    expect(extractInstagramReelId("https://www.instagram.com/")).toEqual({
      ok: false,
      error: "NOT_REEL",
    });
  });

  it("rejects a bare /reel/ path without an id", () => {
    expect(extractInstagramReelId("https://www.instagram.com/reel/")).toEqual({
      ok: false,
      error: "NOT_REEL",
    });
  });

  it("handles posts and tv as media too", () => {
    expect(extractInstagramReelId("https://www.instagram.com/p/ABCdef123/")).toMatchObject({
      ok: true,
      reelId: "ABCdef123",
    });
  });
});

describe("URL normalization → duplicate protection key", () => {
  it("two differently-formatted URLs of the same reel produce the same canonical URL", () => {
    const a = extractInstagramReelId("https://instagram.com/reel/C123456789/");
    const b = extractInstagramReelId("https://www.instagram.com/reel/C123456789/?igsh=xyz");
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.normalizedUrl).toBe(b.normalizedUrl);
      expect(a.reelId).toBe(b.reelId);
      expect(normalizeReelUrl(b.reelId)).toBe(a.normalizedUrl);
    }
  });
});

describe("isInstagramUrl", () => {
  it("detects instagram hosts", () => {
    expect(isInstagramUrl("https://www.instagram.com/reel/x/")).toBe(true);
    expect(isInstagramUrl("https://instagram.com")).toBe(true);
    expect(isInstagramUrl("https://notinstagram.com/reel/x/")).toBe(false);
  });
});