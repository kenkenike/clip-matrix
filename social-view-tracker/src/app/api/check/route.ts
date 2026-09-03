import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getProviders, validateAnyUrl } from "@/lib/providers";
import { InstagramProvider } from "@/lib/providers/instagram";
import {
  RateLimitedError,
  type CollectionResult,
  type ProviderInput,
} from "@/lib/providers/types";

const schema = z.object({
  url: z.string().trim().min(1, "Paste a link.").max(2048),
});

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid URL.", 422, "VALIDATION");
  }

  const validated = validateAnyUrl(parsed.data.url);
  if (!validated.valid || !validated.platform) {
    return apiError(
      validated.error ?? "Unsupported URL.",
      422,
      "UNSUPPORTED_URL",
    );
  }

  const input: ProviderInput = {
    url: validated.normalizedUrl ?? parsed.data.url,
    externalId: validated.externalId ?? "",
    kind: validated.kind ?? "OTHER",
  };

  let result: CollectionResult;
  try {
    if (validated.platform === "INSTAGRAM") {
      const accounts = await prisma.instagramAccount.findMany({
        where: { userId: user.id },
        select: {
          username: true,
          accessToken: true,
          insightsAccessToken: true,
          sessionCookie: true,
        },
      });
      result = await new InstagramProvider(accounts).getMetrics(input);
    } else {
      result = await getProviders()[validated.platform].getMetrics(input);
    }
  } catch (err) {
    if (err instanceof RateLimitedError) {
      result = { status: "RATE_LIMITED", error: err.message };
    } else {
      result = {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error.",
      };
    }
  }

  return json({
    platform: validated.platform,
    kind: result.metadata?.kind ?? validated.kind,
    status: result.status,
    source: result.source ?? null,
    error: result.error ?? null,
    views: result.metrics?.views ?? null,
    likes: result.metrics?.likes ?? null,
    comments: result.metrics?.comments ?? null,
    title: result.metadata?.title ?? null,
    caption: result.metadata?.caption ?? null,
    accountName: result.metadata?.accountName ?? null,
    thumbnailUrl: result.metadata?.thumbnailUrl ?? null,
    publishedAt: result.metadata?.publishedAt ?? null,
  });
}