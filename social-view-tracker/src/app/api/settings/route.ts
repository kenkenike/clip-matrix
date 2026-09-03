import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, getApiUser, json } from "@/lib/api";
import { getUsage } from "@/lib/services/usage";

const schema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  email: z.string().email().trim().toLowerCase().optional(),
});

export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });
  const usage = await getUsage(user.id);
  return json({
    profile: dbUser,
    usage,
    notifications: {
      // Scheduled-check email preferences are read at delivery time from env;
      // the client stores light preferences locally.
      emailAlerts: true,
    },
  });
}

export async function PATCH(request: NextRequest) {
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
    return apiError("Invalid settings payload.", 422, "VALIDATION");
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, email: parsed.data.email },
    select: { id: true, name: true, email: true, image: true },
  });
  return json({ profile: updated });
}