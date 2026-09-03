import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, getApiUser, json } from "@/lib/api";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";

const addSchema = z.object({
  accessToken: z.string().trim().min(10, "The token looks too short."),
  insightsAccessToken: z.string().trim().min(10, "The insights token looks too short.").optional(),
  sessionCookie: z.string().trim().min(3, "The session cookie looks too short.").optional(),
});

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;

  const accounts = await prisma.instagramAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      instagramUserId: true,
      accessToken: true,
      insightsAccessToken: true,
      sessionCookie: true,
      lastVerifiedAt: true,
      createdAt: true,
    },
  });

  return json({
    accounts: accounts.map((a) => ({
      id: a.id,
      username: a.username,
      instagramUserId: a.instagramUserId,
      accessTokenMasked: maskToken(a.accessToken),
      hasInsights: (a.insightsAccessToken?.length ?? 0) > 0,
      hasSession: (a.sessionCookie?.length ?? 0) > 0,
      lastVerifiedAt: a.lastVerifiedAt,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Invalid payload.",
      422,
      "VALIDATION",
    );
  }

  const token = parsed.data.accessToken;
  let meta: { id: string; username: string };
  try {
    const res = await fetch(
      `${GRAPH_BASE}/me?fields=id,username&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const result = (await res.json()) as {
      id?: string;
      username?: string;
      error?: { message?: string; code?: number };
    };
    if (!res.ok || result.error || !result.id || !result.username) {
      return apiError(
        `Instagram rejected this token: ${result.error?.message ?? res.statusText}. Generate a fresh long-lived token for the account and try again.`,
        400,
        "INSTAGRAM_TOKEN_INVALID",
      );
    }
    meta = { id: result.id, username: result.username };
  } catch {
    return apiError(
      "Could not reach the Instagram Graph API to verify the token. Check network access and try again.",
      502,
      "INSTAGRAM_UNREACHABLE",
    );
  }

  const insightsToken = parsed.data.insightsAccessToken?.trim();
  if (insightsToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id&access_token=${encodeURIComponent(insightsToken)}`,
        { cache: "no-store" },
      );
      const result = (await res.json()) as { error?: { message?: string } };
      if (!res.ok || result.error) {
        return apiError(
          `Facebook rejected the insights token: ${result.error?.message ?? res.statusText}. This must be a Facebook Login / system token with the instagram_business_manage_insights permission.`,
          400,
          "FACEBOOK_TOKEN_INVALID",
        );
      }
    } catch {
      return apiError(
        "Could not reach the Facebook Graph API to verify the insights token.",
        502,
        "FACEBOOK_UNREACHABLE",
      );
    }
  }

  const saved = await prisma.instagramAccount.upsert({
    where: { userId_username: { userId: user.id, username: meta.username } },
    create: {
      userId: user.id,
      username: meta.username,
      instagramUserId: meta.id,
      accessToken: token,
      insightsAccessToken: insightsToken ?? null,
      sessionCookie: parsed.data.sessionCookie?.trim() ?? null,
      lastVerifiedAt: new Date(),
    },
    update: {
      accessToken: token,
      instagramUserId: meta.id,
      insightsAccessToken: insightsToken ?? null,
      sessionCookie: parsed.data.sessionCookie?.trim() ?? null,
      lastVerifiedAt: new Date(),
    },
    select: {
      id: true,
      username: true,
      instagramUserId: true,
      accessToken: true,
      insightsAccessToken: true,
      sessionCookie: true,
      lastVerifiedAt: true,
      createdAt: true,
    },
  });

  return json({
    account: {
      id: saved.id,
      username: saved.username,
      instagramUserId: saved.instagramUserId,
      accessTokenMasked: maskToken(saved.accessToken),
      hasInsights: (saved.insightsAccessToken?.length ?? 0) > 0,
      hasSession: (saved.sessionCookie?.length ?? 0) > 0,
      lastVerifiedAt: saved.lastVerifiedAt,
      createdAt: saved.createdAt,
    },
  });
}

function maskToken(token: string): string {
  if (token.length <= 8) return "••••";
  return `••••••••${token.slice(-6)}`;
}