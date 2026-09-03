/**
 * Meta Instagram OAuth helper — builds the authorize URL and exchanges the
 * authorization code for an access token. Token storage/encryption happens
 * downstream in InstagramConnection records; nothing here touches the browser.
 */
import {
  FB_GRAPH_BASE,
  getIgIdentity,
  getLinkedIgAccount,
  type GraphCallResult,
} from "@/lib/instagram/graph-client";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string[];
};

export const DEFAULT_META_SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
];

/** Reads config from env; returns null when Meta OAuth is not configured. */
export function getMetaConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const redirectUri = process.env.META_REDIRECT_URI?.trim();
  if (!appId || !appSecret || !redirectUri) return null;
  const scopes = process.env.META_SCOPES?.split(",").map((s) => s.trim()).filter(Boolean);
  return { appId, appSecret, redirectUri, scopes: scopes?.length ? scopes : DEFAULT_META_SCOPES };
}

export function buildAuthorizeUrl(config: MetaConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(","),
    state,
  });
  return `${FB_GRAPH_BASE}/dialog/oauth?${params.toString()}`;
}

export type TokenExchangeResult = { accessToken: string; expiresAt: Date | null };

/**
 * Exchanges the one-time authorization code for an access token. Tries the
 * long-lived exchange (fb_exchange_token) so the stored token lasts ~60 days;
 * falls back to the short-lived token when the long-lived exchange is refused
 * (necessary for apps still in development mode).
 */
export async function exchangeCodeForToken(
  config: MetaConfig,
  code: string,
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  });
  const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`, {
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string; code?: number };
  };
  if (!res.ok || !body.access_token) {
    throw new Error(
      `Meta OAuth code exchange failed: ${body.error?.message ?? `HTTP ${res.status}`}`,
    );
  }
  const shortLived = body.access_token;

  const longParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLived,
  });
  try {
    const longRes = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${longParams.toString()}`, {
      cache: "no-store",
    });
    const longBody = (await longRes.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: { message?: string };
    };
    if (longRes.ok && longBody.access_token) {
      const expires = typeof longBody.expires_in === "number" ? longBody.expires_in : null;
      return {
        accessToken: longBody.access_token,
        expiresAt: expires ? new Date(Date.now() + expires * 1000) : null,
      };
    }
  } catch {
    /* fall through to the short-lived token */
  }
  return {
    accessToken: shortLived,
    expiresAt: typeof body.expires_in === "number" ? new Date(Date.now() + body.expires_in * 1000) : null,
  };
}

export type IdentityResult =
  | {
      ok: true;
      instagramUserId: string;
      instagramUsername: string;
      isBusinessLinked: boolean;
      via: "ig_me" | "facebook_pages";
      httpStatus: number;
      responseTimeMs: number;
    }
  | {
      ok: false;
      httpStatus?: number;
      responseTimeMs: number;
      category: string;
      errorMessage: string;
    };

/**
 * Finds the Instagram account behind an OAuth token. Prefers the IG Graph
 * `/me` endpoint; falls back to the linked Facebook page's business account.
 */
export async function identifyInstagramAccount(accessToken: string): Promise<IdentityResult> {
  const viaIgMe = await getIgIdentity(accessToken);
  if (viaIgMe.ok && viaIgMe.data.user_id && viaIgMe.data.username) {
    return {
      ok: true,
      instagramUserId: viaIgMe.data.user_id,
      instagramUsername: viaIgMe.data.username,
      isBusinessLinked: true,
      via: "ig_me",
      httpStatus: viaIgMe.httpStatus,
      responseTimeMs: viaIgMe.responseTimeMs,
    };
  }

  const viaPages = await getLinkedIgAccount(accessToken);
  if (viaPages.ok) {
    return {
      ok: true,
      instagramUserId: viaPages.data.id,
      instagramUsername: viaPages.data.username,
      isBusinessLinked: true,
      via: "facebook_pages",
      httpStatus: viaPages.httpStatus,
      responseTimeMs: viaPages.responseTimeMs,
    };
  }
  const failure = viaPages as Extract<GraphCallResult<never>, { ok: false }>;
  return {
    ok: false,
    httpStatus: failure.httpStatus,
    responseTimeMs: failure.responseTimeMs,
    category: failure.category,
    errorMessage: failure.errorMessage,
  };
}