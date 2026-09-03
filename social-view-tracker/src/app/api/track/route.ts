import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { trackUrl } from "@/lib/services/content";

const schema = z.object({
  url: z.string().min(1).max(2048),
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
    return apiError("Provide a `url` field with a YouTube or Instagram URL.", 422, "VALIDATION");
  }

  const result = await trackUrl(user.id, parsed.data.url);
  if (!result.ok) {
    return apiError(result.error, result.code === "LIMIT_REACHED" ? 403 : 422, result.code ?? "INVALID_URL");
  }

  return json(
    {
      content: {
        id: result.content.id,
        url: result.content.url,
        platform: result.content.platform,
        status: result.content.status,
      },
      duplicate: result.duplicate,
      note: result.duplicate
        ? "This URL is already tracked."
        : "Metric collection queued. Poll GET /api/content/:id until status changes from PROCESSING.",
    },
    { status: result.duplicate ? 200 : 201 },
  );
}

export async function GET() {
  const { error } = await getApiUser();
  if (error) return error;
  const totals = { tracked: 0, processing: 0 };
  return json(totals);
}