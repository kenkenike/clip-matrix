import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api";
import {
  exchangeCodeForToken,
  getMetaConfig,
  identifyInstagramAccount,
} from "@/lib/instagram/oauth";
import { saveConnection } from "@/lib/services/instagram-connections";
import {
  deleteTransientCookie,
  readTransientCookie,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const SETTINGS = "/app/settings";

/**
 * Meta/Instagram OAuth callback. Verifies the CSRF state cookie (binding this
 * authorization to the user who started it), exchanges the code for an access
 * token, identifies the Instagram account behind it, and stores an encrypted
 * InstagramConnection. Always redirects back to the app — never returns JSON
 * to the browser.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const settings = (suffix: string) => NextResponse.redirect(new URL(`${SETTINGS}?${suffix}`, request.url));

  const { user, error } = await getApiUser();
  if (error) {
    return settings("ig_status=error&ig_error=Not signed in to Social View Tracker.");
  }

  const oauthError = sp.get("error");
  if (oauthError) {
    const description = sp.get("error_description") ?? "Meta OAuth was cancelled or denied.";
    return settings(`ig_status=error&ig_error=${encodeURIComponent(description)}`);
  }

  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) {
    return settings("ig_status=error&ig_error=The OAuth callback was malformed.");
  }

  const stored = await readTransientCookie("ig_oauth_state");
  await deleteTransientCookie("ig_oauth_state");
  if (!stored || stored !== `${user.id}:${state}`) {
    return settings("ig_status=error&ig_error=OAuth state did not match. Please try connecting again.");
  }

  const config = getMetaConfig();
  if (!config) {
    return settings("ig_status=error&ig_error=Meta OAuth is not configured on the server.");
  }

  try {
    const exchange = await exchangeCodeForToken(config, code);
    const identity = await identifyInstagramAccount(exchange.accessToken);
    if (!identity.ok) {
      return settings(
        `ig_status=error&ig_error=${encodeURIComponent(
          `Could not read the Instagram account behind this token (${identity.errorMessage}).`,
        )}`,
      );
    }

    const saved = await saveConnection(user.id, {
      instagramUserId: identity.instagramUserId,
      instagramUsername: identity.instagramUsername,
      accessToken: exchange.accessToken,
      tokenExpiresAt: exchange.expiresAt,
      scopes: config.scopes,
      isBusinessLinked: identity.isBusinessLinked,
    });

    return settings(
      `ig_status=connected&ig_username=${encodeURIComponent(saved.instagramUsername)}`,
    );
  } catch (err) {
    return settings(
      `ig_status=error&ig_error=${encodeURIComponent(
        err instanceof Error ? err.message : "Unknown Meta OAuth error.",
      )}`,
    );
  }
}