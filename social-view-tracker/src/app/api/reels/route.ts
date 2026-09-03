import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { logApiRequest } from "@/lib/services/reel-log";
import { addReel, listReels, reelFiltersSchema } from "@/lib/services/reels";

const addSchema = z.object({
  url: z.string().trim().min(1, "Provide an Instagram Reel URL.").max(2048),
});

export async function POST(request: NextRequest) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const limited = !rateLimit(`reels:${user.id}:add`);
  logApiRequest({
    userId: user.id,
    method: "POST",
    path: "/api/reels",
    status: limited ? 429 : 201,
    durationMs: Math.round(performance.now() - start),
  });

  if (limited) {
    return apiError("Too many requests. Slow down and try again shortly.", 429, "RATE_LIMITED");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid request body.", 422, "VALIDATION");
  }

  const result = await addReel(user.id, parsed.data.url);
  if (!result.ok) {
    return apiError(result.error, result.duplicate ? 409 : 422, result.code);
  }
  return json(
    {
      message: result.message,
      status: result.status ?? null,
      reel: result.reel,
    },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const start = performance.now();
  const { user, error } = await getApiUser();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const parsed = reelFiltersSchema.safeParse({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    page: sp.get("page") ?? undefined,
    pageSize: sp.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("Invalid filter.", 422, "VALIDATION");
  }

  const { reels, total, page, pageSize, pages } = await listReels(user.id, parsed.data);

  logApiRequest({
    userId: user.id,
    method: "GET",
    path: "/api/reels",
    status: 200,
    durationMs: Math.round(performance.now() - start),
  });

  return json({ reels, total, page, pageSize, pages });
}