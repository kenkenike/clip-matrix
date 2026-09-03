import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, json } from "@/lib/api";
import { hashPassword, isValidPasswordStrength } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
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
    return apiError("Invalid registration details.", 422, "VALIDATION", parsed.error.flatten().fieldErrors);
  }
  const { name, email, password } = parsed.data;

  const strength = isValidPasswordStrength(password);
  if (!strength.ok) return apiError(strength.reason ?? "Weak password.", 422, "WEAK_PASSWORD");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("An account with this email already exists.", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      plan: { create: {} },
    },
    select: { id: true, name: true, email: true },
  });

  await setSessionCookie({ userId: user.id });
  return json({ user }, { status: 201 });
}

export async function GET() {
  // Probe endpoint used by the client when the UI wants platform-feature info.
  const youtubeConfigured = Boolean(process.env.YOUTUBE_API_KEY);
  const instagramConfigured = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
  return json({
    providers: {
      YOUTUBE: youtubeConfigured ? "configured" : "unconfigured",
      INSTAGRAM: instagramConfigured ? "configured" : "unconfigured",
      TIKTOK: "web",
      X: "web",
    },
    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    sampleUrls: [
      "https://www.youtube.com/watch?v=VIDEO_ID",
      "https://youtu.be/VIDEO_ID",
      "https://www.youtube.com/shorts/VIDEO_ID",
      "https://www.youtube.com/@handle",
      "https://www.instagram.com/reel/POST_ID/",
      "https://www.instagram.com/p/POST_ID/",
      "https://www.tiktok.com/@handle/video/VIDEO_ID",
      "https://vm.tiktok.com/SHORT_CODE",
      "https://x.com/handle/status/POST_ID",
      "https://twitter.com/handle/status/POST_ID",
    ],
  });
}