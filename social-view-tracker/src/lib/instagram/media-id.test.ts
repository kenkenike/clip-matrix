import { describe, expect, it } from "vitest";
import { mediaIdToShortcode, shortcodeToMediaId } from "./media-id";

describe("shortcode <-> media id (Meta's own encoding, deterministic)", () => {
  it("pins a canonical decode", () => {
    expect(shortcodeToMediaId("C123456789")).toBe("51188305968742205");
    expect(mediaIdToShortcode("51188305968742205")).toBe("C123456789");
  });

  it("round-trips arbitrary numeric ids", () => {
    for (const id of [0, 1, 63, 64, 4096, 2652631051222815, 7_004_232_198_719_283]) {
      const shortcode = mediaIdToShortcode(id)!;
      expect(shortcode).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(shortcodeToMediaId(shortcode)).toBe(String(id));
    }
  });

  it("round-trips arbitrary shortcodes", () => {
    // Leading "A"s are leading zeros in this base-64 encoding; the canonical
    // text form never carries them.
    const canonical = (s: string) => s.replace(/^A+/, "") || "A";
    for (const shortcode of ["AAAAAAAAAAA", "CGoRuqiqeyD", "B8Q5xLkBODM", "_-zz99"]) {
      const id = shortcodeToMediaId(shortcode)!;
      expect(mediaIdToShortcode(id)).toBe(canonical(shortcode));
      expect(shortcodeToMediaId(mediaIdToShortcode(id)!)).toBe(String(id));
    }
  });

  it("rejects malformed shortcodes", () => {
    expect(shortcodeToMediaId("")).toBeNull();
    expect(shortcodeToMediaId("not a code!")).toBeNull();
    expect(shortcodeToMediaId("C1#%$")).toBeNull();
  });

  it("rejects negative media ids", () => {
    expect(mediaIdToShortcode(-1)).toBeNull();
    expect(mediaIdToShortcode("-42")).toBeNull();
  });
});