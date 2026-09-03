import { getApiUser, json } from "@/lib/api";
import { getOverview } from "@/lib/services/analytics";

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const overview = await getOverview(user.id);
  return json(overview, { headers: { "Cache-Control": "no-store" } });
}