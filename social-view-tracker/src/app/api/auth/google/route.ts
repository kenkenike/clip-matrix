import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/auth-google";
import { createSession, setTransientCookie } from "@/lib/session";
import { absoluteUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (!isGoogleAuthConfigured()) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("error", "google-not-configured");
    return NextResponse.redirect(login);
  }
  const state = randomBytes(24).toString("hex");
  const redirectTo = request.nextUrl.searchParams.get("next") ?? "/app";
  const stateToken = await createSession({ state, redirectTo });
  await setTransientCookie("svt_oauth_state", stateToken, 600);
  return NextResponse.redirect(buildGoogleAuthUrl(state));
}

export async function POST() {
  // Same behavior as GET; keeping the handler simple.
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL(`/login?error=google-not-configured`, absoluteUrl("/")));
  }
  const state = randomBytes(24).toString("hex");
  const stateToken = await createSession({ state });
  await setTransientCookie("svt_oauth_state", stateToken, 600);
  return NextResponse.redirect(buildGoogleAuthUrl(state));
}