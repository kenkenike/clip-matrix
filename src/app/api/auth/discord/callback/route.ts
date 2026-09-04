import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/auth/discord";
import { syncDiscordProfile } from "@/lib/auth/profile-sync";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const store = await cookies();
  const savedState = store.get("oauth_state")?.value;

  store.set("oauth_state", "", { maxAge: 0, path: "/" });

  if (error) {
    const reason = encodeURIComponent(error);
    return NextResponse.redirect(
      new URL(`/login?error=${reason}`, request.url)
    );
  }

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_request", request.url)
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const discordUser = await fetchDiscordUser(accessToken);
    const sessionPayload = await syncDiscordProfile(discordUser);
    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    const roleRedirect: Record<string, string> = {
      admin: "/admin",
      moderator: "/mod",
      brand: "/brand",
      creator: "/dashboard",
    };

    const redirectPath = roleRedirect[sessionPayload.role] ?? "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
