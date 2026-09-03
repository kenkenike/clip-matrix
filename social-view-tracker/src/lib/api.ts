import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveApiKey } from "@/lib/services/api-key";
import { recordApiCall } from "@/lib/services/usage";

/**
 * Converts a value that may be a Prisma BigInt into a JSON-safe number.
 */
export function bign(value: bigint | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "bigint" ? Number(value) : value;
}

/**
 * JSON response helper that survives JSON.stringify's BigInt failure mode.
 */
export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export function apiError(
  message: string,
  status = 400,
  code?: string,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code, details } satisfies ApiError, {
    status,
  });
}

export async function getApiUser() {
  const user = await getCurrentUser();
  if (!user || !user.id) {
    return { user: null, error: apiError("Not authenticated", 401, "UNAUTHENTICATED") } as const;
  }
  return { user: user as NonNullable<typeof user> & { id: string }, error: null } as const;
}

/**
 * Authenticates a request using either the session cookie or a Bearer API key.
 * Used by programmable endpoints so users can consume the app over HTTP.
 */
export async function getApiUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice("Bearer ".length).trim();
    const userId = await resolveApiKey(rawKey);
    if (!userId) {
      return { user: null, error: apiError("Invalid or revoked API key.", 401, "INVALID_API_KEY") } as const;
    }
    void recordApiCall(userId);
    const provider = await getCurrentUser();
    const synthetic = {
      id: userId,
      name: provider?.name ?? "API User",
      email: provider?.email ?? "",
      image: provider?.image ?? null,
      plan: provider?.plan?.plan ?? "FREE",
    };
    return { user: synthetic, error: null } as const;
  }
  return getApiUser();
}

export function parseBody<T>(body: string | null): T | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 20) || 20),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}