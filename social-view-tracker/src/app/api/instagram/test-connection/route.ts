import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { testConnection } from "@/lib/services/instagram-connections";

export const dynamic = "force-dynamic";

const schema = z.object({
  connectionId: z.string().min(1),
});

/**
 * Runs a live identity check against graph.instagram.com with the stored
 * (decrypted server-side) token for the given connection. Reports the endpoint,
 * HTTP status, and response time so failures are diagnosable. Only the owning
 * user's connections can be tested; tokens never reach the client.
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
    return apiError("connectionId is required.", 422, "VALIDATION");
  }

  const result = await testConnection(user.id, parsed.data.connectionId);
  return json(result);
}