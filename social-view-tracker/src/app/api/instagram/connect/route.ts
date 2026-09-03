import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, getApiUser } from "@/lib/api";
import { buildAuthorizeUrl, getMetaConfig } from "@/lib/instagram/oauth";
import { setTransientCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Starts the Meta/Instagram OAuth flow. Requires an authenticated user (the
 * flow binds the authorization to that user's account) and a configured Meta
 * app. Redirects to the Meta authorize dialog after storing a CSRF state
 * cookie that binds this user to this authorization attempt.
 */
export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;

  const config = getMetaConfig();
  if (!config) {
    return apiError(
      "Meta OAuth is not configured. Set META_APP_ID, META_APP_SECRET and META_REDIRECT_URI.",
      500,
      "OAUTH_NOT_CONFIGURED",
    );
  }

  const state = randomBytes(18).toString("hex");
  await setTransientCookie("ig_oauth_state", `${user.id}:${state}`, 600);

  const url = buildAuthorizeUrl(config, state);
  return NextResponse.redirect(url);
}