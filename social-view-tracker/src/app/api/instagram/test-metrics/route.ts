import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { testMetricsPipeline } from "@/lib/services/instagram-connections";

export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().trim().min(1).max(2048),
});

/**
 * Runs the full 7-step pipeline against the authorized API for a reel URL:
 *   URL validate → connection present → media resolve → media id →
 *   metrics request → views received → (applicable) DB record.
 * Returns each step's ok/✓ or fail/✗ plus the final view count. Used by the
 * admin Instagram debug panel. No views are ever fabricated.
 */
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
    return apiError("Provide an Instagram Reel URL.", 422, "VALIDATION");
  }

  const result = await testMetricsPipeline(user.id, parsed.data.url);
  return json(result);
}