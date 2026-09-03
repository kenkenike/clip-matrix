import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { trackUrls } from "@/lib/services/content";

const bodySchema = z.object({
  urls: z.array(z.string().min(1).max(2048)).min(1).max(100),
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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Provide a `urls` array with at least one YouTube or Instagram URL.",
      422,
      "VALIDATION",
    );
  }

  const { created, failed } = await trackUrls(user.id, parsed.data.urls);
  return json(
    {
      created,
      failed: failed.map((f) => f.error),
      summary: `${created} tracked, ${failed.length} invalid or duplicate`,
    },
    { status: created > 0 ? 201 : 200 },
  );
}