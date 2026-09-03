import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getApiUser, json } from "@/lib/api";
import { createApiKey, listApiKeys } from "@/lib/services/api-key";
import { getEffectivePlan } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(80).trim(),
  scope: z.enum(["READ", "WRITE", "ADMIN"]).default("READ"),
});

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const keys = await listApiKeys(user.id);
  return json({ apiKeys: keys });
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid API key payload.", 422, "VALIDATION");
  }

  const plan = await getEffectivePlan(user.id);
  const existing = await listApiKeys(user.id);
  if (existing.length >= plan.maxApiKeys) {
    return apiError(
      `API key limit reached (${plan.maxApiKeys}). Upgrade your plan for more keys.`,
      403,
      "LIMIT_REACHED",
    );
  }

  try {
    const { rawKey, prefix } = await createApiKey(user.id, parsed.data.name, parsed.data.scope);
    return json(
      {
        apiKey: { prefix, name: parsed.data.name, scope: parsed.data.scope, rawKey },
        warning: "Store this key now — the full key is shown only once.",
      },
      { status: 201 },
    );
  } catch (err) {
    return apiError((err as Error).message, 422, "KEY_ERROR");
  }
}