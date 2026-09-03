import { getApiUser, json } from "@/lib/api";
import { getMetaConfig } from "@/lib/instagram/oauth";
import { listConnections } from "@/lib/services/instagram-connections";

export const dynamic = "force-dynamic";

/**
 * Lists the user's encrypted OAuth connections. Tokens are never exposed: the
 * response only carries maskable metadata plus whether OAuth is configured on
 * the server (so the UI can show the Connect button honestly).
 */
export async function GET() {
  const { user, error } = await getApiUser();
  if (error) return error;

  const [connections, config] = await Promise.all([listConnections(user.id), Promise.resolve(getMetaConfig())]);

  return json({
    oauthConfigured: config !== null,
    requestedScopes: config?.scopes ?? null,
    connections: connections.map((c) => ({
      id: c.id,
      instagramUserId: c.instagramUserId,
      instagramUsername: c.instagramUsername,
      tokenExpiresAt: c.tokenExpiresAt,
      scopes: c.scopes ? c.scopes.split(",") : [],
      isBusinessLinked: c.isBusinessLinked,
      lastVerifiedAt: c.lastVerifiedAt,
      createdAt: c.createdAt,
      tokenMasked: "••••••••••••••••",
    })),
  });
}