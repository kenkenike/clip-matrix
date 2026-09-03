import { getApiUser, json } from "@/lib/api";
import { getUsage } from "@/lib/services/usage";

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const usage = await getUsage(user.id);
  return json(usage, { headers: { "Cache-Control": "no-store" } });
}