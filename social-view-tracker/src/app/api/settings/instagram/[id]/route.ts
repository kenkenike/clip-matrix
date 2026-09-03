import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, getApiUser, json } from "@/lib/api";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getApiUser();
  if (error) return error;
  const { id } = await ctx.params;

  const existing = await prisma.instagramAccount.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return apiError("Instagram account not found.", 404, "NOT_FOUND");

  await prisma.instagramAccount.delete({ where: { id } });
  return json({ ok: true, id });
}