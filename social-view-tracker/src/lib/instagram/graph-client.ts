/**
 * Official Instagram/Meta Graph API client.
 *
 * Only authorized endpoints are used here — the public instagram.com web page
 * is never fetched. Each call records HTTP status, response time, the endpoint
 * that was hit, and a normalized error category so the diagnostics panel can
 * show exactly which step failed and why.
 */

export const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "21.0";
export const IG_GRAPH_BASE = `https://graph.instagram.com/v${GRAPH_VERSION}`;
export const FB_GRAPH_BASE = `https://graph.facebook.com/v${GRAPH_VERSION}`;

export type InstagramErrorCategory =
  | "oauth"
  | "permission"
  | "media_resolution"
  | "metric_availability"
  | "rate_limit"
  | "temporary"
  | "media_deleted"
  | "network";

export type GraphCallResult<T> =
  | {
      ok: true;
      httpStatus: number;
      responseTimeMs: number;
      endpoint: string;
      data: T;
    }
  | {
      ok: false;
      httpStatus?: number;
      responseTimeMs: number;
      endpoint: string;
      category: InstagramErrorCategory;
      errorCode?: string;
      errorMessage: string;
    };

type MetaErrorBody = {
  error?: { message?: string; code?: number; error_subcode?: number; type?: string };
};

/**
 * Maps a Meta/Instagram Graph API error body to a normalized category.
 */
export function categorizeError(
  body: MetaErrorBody,
  httpStatus?: number,
  endpoint?: string,
): { category: InstagramErrorCategory; code?: string; message: string } {
  const err = body?.error;
  const message = err?.message ?? (httpStatus ? `HTTP ${httpStatus}` : "Unknown Instagram API error");
  const code = err?.code;
  const isMediaInsights = endpoint?.includes("/insights") ?? false;

  if (!err) {
    if (httpStatus && httpStatus >= 500) return { category: "temporary", message };
    return { category: "temporary", message };
  }

  // Token problems.
  if (
    code === 190 ||
    /validating access token|session has expired|OAuthException/i.test(message)
  ) {
    return { category: "oauth", code: String(code), message };
  }

  // Rate limits.
  if (
    httpStatus === 429 ||
    [4, 17, 32, 613].includes(code ?? -1) ||
    /rate.?limit|too many requests|temporarily.*blocked|request limit reached/i.test(message)
  ) {
    return { category: "rate_limit", code: String(code), message };
  }

  // Deleted / gone media.
  if (
    code === 100 &&
    /deleted|removed|no longer exists|has been removed|expired/i.test(message)
  ) {
    return { category: "media_deleted", code: String(code), message };
  }

  // The insights endpoint returns code 10 when the metric is not available for
  // this token/media combination (e.g. the media is not owned by the connected
  // account, or the account lacks instagram_manage_insights).
  if (isMediaInsights && code === 10) {
    return { category: "metric_availability", code: String(code), message };
  }

  // Permission problems.
  if (code === 10 || /permission|not authorized|insufficient/i.test(message)) {
    return { category: "permission", code: String(code), message };
  }

  // Invalid media id / node not found.
  if (
    code === 100 ||
    /no node with the specified id|bad parameter|invalid media|does not exist|id of type/i.test(message)
  ) {
    return { category: "media_resolution", code: String(code), message };
  }

  if (code === 2 || /temporarily unavailable|unexpected error/i.test(message)) {
    return { category: "temporary", code: String(code), message };
  }

  return { category: "temporary", code: String(code), message };
}

async function callGraph<T>(
  url: string,
  accessToken: string,
  contextualize: (body: MetaErrorBody, httpStatus?: number, endpoint?: string) => ReturnType<typeof categorizeError>,
): Promise<GraphCallResult<T>> {
  const started = Date.now();
  const endpoint = url.split("?")[0];
  const params = new URL(url);
  params.searchParams.set("access_token", accessToken);
  try {
    const res = await fetch(params.toString(), { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as MetaErrorBody & T;
    const ms = Date.now() - started;
    if (!res.ok || (body as MetaErrorBody).error) {
      const { category, code, message } = contextualize(body, res.status, endpoint);
      return {
        ok: false,
        httpStatus: res.status,
        responseTimeMs: ms,
        endpoint,
        category,
        errorCode: code,
        errorMessage: message,
      };
    }
    return { ok: true, httpStatus: res.status, responseTimeMs: ms, endpoint, data: body as T };
  } catch (err) {
    return {
      ok: false,
      responseTimeMs: Date.now() - started,
      endpoint,
      category: "network",
      errorMessage:
        err instanceof Error
          ? `Could not reach the Instagram/Meta API (${err.message}).`
          : "Could not reach the Instagram/Meta API.",
    };
  }
}

export type InstagramMediaPayload = {
  id?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
  username?: string;
};

export type InstagramUserPayload = {
  user_id?: string;
  username?: string;
};

/** Reads a media object through the authorized account. */
export function getMedia(
  mediaId: string,
  accessToken: string,
): Promise<GraphCallResult<InstagramMediaPayload>> {
  const params = new URLSearchParams({
    fields:
      "id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count,timestamp,username",
  });
  return callGraph<InstagramMediaPayload>(
    `${IG_GRAPH_BASE}/${encodeURIComponent(mediaId)}?${params.toString()}`,
    accessToken,
    categorizeError,
  );
}

/** Reads the `plays` insight (official reel/video view count). */
export function getMediaPlays(
  mediaId: string,
  accessToken: string,
): Promise<GraphCallResult<number>> {
  return callGraph<{ data?: Array<{ name?: string; values?: Array<{ value?: number }> }> }>(
    `${IG_GRAPH_BASE}/${encodeURIComponent(mediaId)}/insights?metric=plays&period=day`,
    accessToken,
    (body, httpStatus, endpoint) =>
      categorizeError(body, httpStatus, endpoint),
  ).then((result) => {
    if (!result.ok) return result;
    const plays = result.data?.data?.find((d) => d.name === "plays")?.values?.[0]?.value;
    if (typeof plays !== "number" || !Number.isFinite(plays)) {
      return {
        ok: false,
        httpStatus: result.httpStatus,
        responseTimeMs: result.responseTimeMs,
        endpoint: result.endpoint,
        category: "metric_availability",
        errorMessage: "The authorized API did not return a plays value for this media.",
      } as GraphCallResult<number>;
    }
    return { ...result, data: Math.round(plays) };
  });
}

/** Identifies the Instagram account behind a token (IG Graph /me endpoint). */
export function getIgIdentity(
  accessToken: string,
): Promise<GraphCallResult<InstagramUserPayload>> {
  return callGraph<InstagramUserPayload>(
    `${IG_GRAPH_BASE}/me?fields=user_id,username`,
    accessToken,
    categorizeError,
  );
}

/**
 * Fallback identity resolution: finds the linked Instagram business/creator
 * account through the Facebook page list the token can see.
 */
export async function getLinkedIgAccount(
  accessToken: string,
): Promise<GraphCallResult<{ id: string; username: string }>> {
  const result = await callGraph<{
    data?: Array<{ id?: string; name?: string; instagram_business_account?: { id?: string; username?: string } }>;
  }>(
    `${FB_GRAPH_BASE}/me/accounts?fields=instagram_business_account{id,username}`,
    accessToken,
    categorizeError,
  );
  if (!result.ok) return result;
  const linked = result.data?.data?.find((p) => p.instagram_business_account?.id);
  const account = linked?.instagram_business_account;
  if (!linked || !account?.id || !account.username) {
    return {
      ok: false,
      httpStatus: result.httpStatus,
      responseTimeMs: result.responseTimeMs,
      endpoint: result.endpoint,
      category: "permission",
      errorMessage:
        "This Meta token is not linked to an Instagram Business/Creator account. Link one in Meta Business settings, then reconnect.",
    };
  }
  return {
    ok: true,
    httpStatus: result.httpStatus,
    responseTimeMs: result.responseTimeMs,
    endpoint: result.endpoint,
    data: { id: account.id, username: account.username },
  };
}