import { getCurrentUser } from "@/lib/auth";
import { apiError, json } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Not authenticated.", 401, "UNAUTHENTICATED");
  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan?.plan ?? "FREE",
    },
  });
}