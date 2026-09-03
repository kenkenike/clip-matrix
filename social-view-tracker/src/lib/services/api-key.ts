import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { ApiKeyScope } from "@prisma/client";

export const KEY_PREFIX_LENGTH = 10;
export const KEY_SECRET_LENGTH = 40;

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function createApiKey(userId: string, name: string, scope: ApiKeyScope) {
  const nameTrimmed = name.trim();
  if (!nameTrimmed) throw new Error("Give the API key a name.");
  const prefix = `svt_${randomBytes(5).toString("hex")}`;
  const secret = randomBytes(30).toString("base64url").slice(0, KEY_SECRET_LENGTH);
  const rawKey = `${prefix}.${secret}`;
  await prisma.apiKey.create({
    data: {
      userId,
      name: nameTrimmed,
      prefix,
      scope,
      keyHash: hashApiKey(rawKey),
    },
  });
  // The raw key is only visible once, at creation time.
  return { rawKey, prefix };
}

export async function listApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scope: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
  return keys;
}

/** Resolves a raw API key to a user id, or null when invalid/revoked. */
export async function resolveApiKey(rawKey: string): Promise<string | null> {
  const keyHash = hashApiKey(rawKey);
  const record = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { userId: true },
  });
  if (record) {
    await prisma.apiKey.updateMany({
      where: { keyHash },
      data: { lastUsedAt: new Date() },
    });
  }
  return record?.userId ?? null;
}

export async function revokeApiKey(userId: string, keyId: string) {
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
  if (!key) return false;
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
  return true;
}