import "server-only";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export type GoogleUserInfo = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  email_verified: boolean | null;
};

function googleClient(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function isGoogleAuthConfigured(): boolean {
  return googleClient() !== null;
}

export function buildGoogleAuthUrl(state: string): string {
  const client = googleClient();
  if (!client) throw new Error("Google OAuth is not configured.");
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: absoluteUrl("/api/auth/google/callback"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const client = googleClient();
  if (!client) throw new Error("Google OAuth is not configured.");
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: absoluteUrl("/api/auth/google/callback"),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status}).`);
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo failed (${userRes.status}).`);
  }
  return (await userRes.json()) as GoogleUserInfo;
}

export async function upsertGoogleUser(info: GoogleUserInfo) {
  let user = await prisma.user.findUnique({ where: { email: info.email } });
  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: info.id,
          emailVerified: info.email_verified ? new Date() : user.emailVerified,
          image: user.image ?? info.picture,
        },
      });
    }
    return user;
  }
  user = await prisma.user.create({
    data: {
      email: info.email,
      name: info.name ?? info.email.split("@")[0],
      image: info.picture,
      googleId: info.id,
      emailVerified: info.email_verified ? new Date() : undefined,
    },
  });
  return user;
}