/**
 * InstagramConnection persistence + diagnostics.
 *
 * Tokens are stored AES-256-GCM-encrypted (see @/lib/instagram/crypto). Only
 * server-side code ever sees a decrypted token; API responses expose masked
 * forms only.
 */
import { prisma } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/instagram/crypto";
import { resolveMediaId, InstagramGraphProvider } from "@/lib/instagram/InstagramMetricsProvider";
import { getIgIdentity } from "@/lib/instagram/graph-client";
import { extractInstagramReelId } from "@/lib/reels/extract";

export type ConnectionRecord = {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
  tokenExpiresAt: Date | null;
  scopes: string | null;
  isBusinessLinked: boolean;
  lastVerifiedAt: Date | null;
  createdAt: Date;
};

/** A connection plus its decrypted token. Server-side only — never returned to the browser. */
export type BoundConnection = {
  connection: {
    id: string;
    userId: string;
    instagramUserId: string;
    instagramUsername: string;
    tokenExpiresAt: Date | null;
    scopes: string | null;
    isBusinessLinked: boolean;
  };
  accessToken: string;
};

export async function listConnections(userId: string): Promise<ConnectionRecord[]> {
  return prisma.instagramConnection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      instagramUserId: true,
      instagramUsername: true,
      tokenExpiresAt: true,
      scopes: true,
      isBusinessLinked: true,
      lastVerifiedAt: true,
      createdAt: true,
    },
  });
}

/** First usable connection for the user, with the decrypted token. Server-side only. */
export async function findConnectionWithToken(
  userId: string,
  connectionId?: string | null,
): Promise<BoundConnection | null> {
  const row = connectionId
    ? await prisma.instagramConnection.findFirst({
        where: { id: connectionId, userId },
      })
    : await prisma.instagramConnection.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
  if (!row) return null;
  const accessToken = decryptSecret(row.accessTokenEncrypted);
  if (!accessToken) return null;
  return {
    connection: {
      id: row.id,
      userId: row.userId,
      instagramUserId: row.instagramUserId,
      instagramUsername: row.instagramUsername,
      tokenExpiresAt: row.tokenExpiresAt,
      scopes: row.scopes,
      isBusinessLinked: row.isBusinessLinked,
    },
    accessToken,
  };
}

export async function saveConnection(
  userId: string,
  input: {
    instagramUserId: string;
    instagramUsername: string;
    accessToken: string;
    tokenExpiresAt: Date | null;
    scopes?: string[] | null;
    isBusinessLinked: boolean;
  },
): Promise<{ id: string; instagramUsername: string }> {
  const saved = await prisma.instagramConnection.upsert({
    where: { userId_instagramUserId: { userId, instagramUserId: input.instagramUserId } },
    create: {
      userId,
      instagramUserId: input.instagramUserId,
      instagramUsername: input.instagramUsername,
      accessTokenEncrypted: encryptSecret(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt,
      scopes: input.scopes?.join(",") ?? null,
      isBusinessLinked: input.isBusinessLinked,
      lastVerifiedAt: new Date(),
    },
    update: {
      instagramUsername: input.instagramUsername,
      accessTokenEncrypted: encryptSecret(input.accessToken),
      tokenExpiresAt: input.tokenExpiresAt,
      scopes: input.scopes?.join(",") ?? null,
      isBusinessLinked: input.isBusinessLinked,
      lastVerifiedAt: new Date(),
    },
    select: { id: true, instagramUsername: true },
  });
  return saved;
}

export async function disconnectConnection(userId: string, connectionId: string): Promise<boolean> {
  const result = await prisma.instagramConnection.deleteMany({
    where: { id: connectionId, userId },
  });
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export async function testConnection(
  userId: string,
  connectionId: string,
): Promise<Record<string, unknown>> {
  const row = await prisma.instagramConnection.findUnique({
    where: { id: connectionId, userId },
  });
  if (!row) {
    return { ok: false, errorMessage: "Connection not found." };
  }
  const token = decryptSecret(row.accessTokenEncrypted);
  if (!token) {
    return {
      ok: false,
      errorMessage: "Could not decrypt the stored access token. Reconnect the account.",
    };
  }

  const identity = await getIgIdentity(token);
  const health = {
    provider: "instagram_graph_api",
    endpoint: `${process.env.META_GRAPH_VERSION?.trim() || "21.0"} /me`,
    httpStatus: identity.httpStatus,
    responseTimeMs: identity.responseTimeMs,
    mediaId: null,
    connectedAccount: identity.ok ? identity.data.username : row.instagramUsername,
    metricRequested: "identity (user_id, username)",
    errorCode: identity.ok ? undefined : identity.errorCode,
    errorMessage: identity.ok ? undefined : identity.errorMessage,
    category: identity.ok ? "ok" : identity.category,
    timestamp: new Date().toISOString(),
  };
  return identity.ok
    ? {
        ok: true,
        step: "connection",
        health,
        instagramUserId: row.instagramUserId,
      }
    : { ok: false, step: "connection", health };
}

export async function testMetricsPipeline(
  userId: string,
  rawUrl: string,
): Promise<Record<string, unknown>> {
  const extracted = extractInstagramReelId(rawUrl);
  const pipeline: Array<Record<string, unknown>> = [];

  pipeline.push({
    step: 1,
    name: "URL validated",
    ok: extracted.ok,
    detail: extracted.ok
      ? `URL → shortcode ${extracted.reelId}`
      : `Invalid URL: ${extracted.error}`,
  });

  const shortcode = extracted.ok ? extracted.reelId : null;
  if (!shortcode) {
    return { ok: false, pipeline };
  }

  const bound = await findConnectionWithToken(userId);
  pipeline.push({
    step: 2,
    name: "Instagram account connected",
    ok: bound !== null,
    detail: bound
      ? `@${bound.connection.instagramUsername} (IG id ${bound.connection.instagramUserId})`
      : "No connected account. Connect one to enable metric tracking.",
  });
  if (!bound) {
    return {
      ok: false,
      status: "connection_required",
      message: "Connect the Instagram account to enable metric tracking.",
      pipeline,
    };
  }

  const resolved = await resolveMediaId(shortcode, bound.accessToken);
  pipeline.push({
    step: 3,
    name: "Media resolved",
    ok: resolved.ok,
    detail: resolved.ok
      ? `Shortcode ${shortcode} → media id ${resolved.mediaId} (verified through authorized API)`
      : `Resolution failed: ${resolved.errorMessage} (category ${resolved.category})`,
  });
  if (!resolved.ok) {
    return { ok: false, pipeline };
  }

  pipeline.push({
    step: 4,
    name: "Media ID",
    ok: true,
    detail: resolved.mediaId,
  });

  const provider = new InstagramGraphProvider();
  const call = await provider.getMediaMetrics(resolved.mediaId, bound.accessToken);

  if (!call.ok) {
    pipeline.push({
      step: 5,
      name: "Metrics request sent",
      ok: false,
      detail: `${call.endpoint} → ${call.category}${call.errorMessage ? `: ${call.errorMessage}` : ""}`,
    });
    pipeline.push({
      step: 6,
      name: "Views received",
      ok: false,
      detail: "No view count could be obtained from the authorized API.",
    });
    return {
      ok: false,
      pipeline,
      callSummary: {
        provider: call.provider,
        endpoint: call.endpoint,
        httpStatus: call.httpStatus,
        responseTimeMs: call.responseTimeMs,
        category: call.category,
        errorMessage: call.errorMessage,
        metricRequested: call.metricRequested,
      },
    };
  }

  pipeline.push({
    step: 5,
    name: "Metrics request sent",
    ok: true,
    detail: `${call.endpoint} → HTTP ${call.httpStatus} in ${call.responseTimeMs}ms (metric: ${call.metricRequested})`,
  });

  pipeline.push({
    step: 6,
    name: "Views received",
    ok: call.data.views !== null,
    detail:
      call.data.views !== null
        ? `${call.data.views.toLocaleString()} views (source ${call.data.source})`
        : "Metric unavailable — the authorized API does not expose plays for this media/account. No number is fabricated.",
  });

  return {
    ok: call.data.views !== null,
    pipeline,
    metrics: { ...call.data, retrievedAt: call.data.retrievedAt },
    callSummary: {
      provider: call.provider,
      endpoint: call.endpoint,
      httpStatus: call.httpStatus,
      responseTimeMs: call.responseTimeMs,
      category: undefined,
      errorMessage: undefined,
      metricRequested: call.metricRequested,
    },
  };
}