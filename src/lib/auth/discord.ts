import type { DiscordUser } from "./types";

const DISCORD_API = "https://discord.com/api";

function getEnvOrThrow(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

export function getDiscordConfig() {
  return {
    clientId: getEnvOrThrow("DISCORD_CLIENT_ID"),
    clientSecret: getEnvOrThrow("DISCORD_CLIENT_SECRET"),
    redirectUri: getEnvOrThrow("DISCORD_REDIRECT_URI"),
  };
}

export function buildAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getDiscordConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getDiscordConfig();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Discord user: ${res.status}`);
  }

  return res.json();
}

export function discordAvatarUrl(discordId: string, avatarHash: string | null): string | null {
  if (!avatarHash) return null;
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`;
}
