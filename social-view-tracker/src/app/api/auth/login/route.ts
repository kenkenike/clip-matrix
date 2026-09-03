import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, json } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

const schema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "BAD_BODY");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("Email and password are required.", 422, "VALIDATION");
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    // Same error for unknown email vs wrong password; also tells OAuth-only
    // users to use "Sign in with Google".
    return apiError(
      user && !user.passwordHash
        ? "This account uses Google sign-in. Use the Google button instead or reset your password."
        : "Invalid email or password.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return apiError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  await setSessionCookie({ userId: user.id });
  return json({ ok: true });
}