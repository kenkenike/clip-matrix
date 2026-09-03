import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

describe("secret encryption (AES-256-GCM)", () => {
  const secret = "supersecrettokenthatislongenough";

  it("round-trips a token", () => {
    process.env.META_TOKEN_ENCRYPTION_KEY = secret;
    const encrypted = encryptSecret("EAAIG-abc123");
    expect(encrypted).not.toContain("abc123");
    expect(decryptSecret(encrypted)).toBe("EAAIG-abc123");
  });

  it("produces versioned, unique payloads", () => {
    process.env.META_TOKEN_ENCRYPTION_KEY = secret;
    const a = encryptSecret("token");
    const b = encryptSecret("token");
    expect(a).toMatch(/^v1\./);
    expect(a).not.toBe(b);
  });

  it("returns null on tampering or garbage", () => {
    process.env.META_TOKEN_ENCRYPTION_KEY = secret;
    const good = encryptSecret("token");
    const parts = good.split(".");
    parts[3] = "tampered___";
    expect(decryptSecret(parts.join("."))).toBeNull();
    expect(decryptSecret("not-a-blob")).toBeNull();
    expect(decryptSecret("")).toBeNull();
  });

  it("requires a configured key", () => {
    delete process.env.META_TOKEN_ENCRYPTION_KEY;
    delete process.env.SESSION_SECRET;
    expect(() => encryptSecret("token")).toThrow(/META_TOKEN_ENCRYPTION_KEY/);
  });

  it("falls back to SESSION_SECRET when the META key is absent", () => {
    delete process.env.META_TOKEN_ENCRYPTION_KEY;
    process.env.SESSION_SECRET = secret;
    const encrypted = encryptSecret("token");
    expect(decryptSecret(encrypted)).toBe("token");
  });
});