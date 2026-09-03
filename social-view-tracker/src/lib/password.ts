import "server-only";
import { hash, compare } from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export function isValidPasswordStrength(password: string): {
  ok: boolean;
  reason?: string;
} {
  if (password.length < 8) {
    return { ok: false, reason: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { ok: false, reason: "Password must be at most 128 characters." };
  }
  return { ok: true };
}