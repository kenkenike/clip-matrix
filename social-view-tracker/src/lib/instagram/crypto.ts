/**
 * Server-side encryption for third-party access tokens.
 *
 * Uses AES-256-GCM with a key derived from META_TOKEN_ENCRYPTION_KEY (or
 * SESSION_SECRET as a development fallback). Encrypted blobs are stored in the
 * database and never exposed to the browser: API surfaces only ever return
 * masked or boolean forms.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function encryptionKey(): Buffer {
  const secret = process.env.META_TOKEN_ENCRYPTION_KEY?.trim()
    ? process.env.META_TOKEN_ENCRYPTION_KEY
    : process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "META_TOKEN_ENCRYPTION_KEY must be set (or SESSION_SECRET, at least 32 chars) to store Instagram access tokens.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromBase64Url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

/** Encrypts a secret. Returns `v1.<iv>.<tag>.<ciphertext>` in base64url. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, toBase64Url(iv), toBase64Url(tag), toBase64Url(ciphertext)].join(".");
}

/** Decrypts a value produced by encryptSecret. Returns null on any failure. */
export function decryptSecret(payload: string): string | null {
  if (!payload) return null;
  try {
    const [version, ivB64, tagB64, ctB64] = payload.split(".");
    if (version !== VERSION || !ivB64 || !tagB64 || !ctB64) return null;
    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), fromBase64Url(ivB64));
    decipher.setAuthTag(fromBase64Url(tagB64));
    return Buffer.concat([
      decipher.update(fromBase64Url(ctB64)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}