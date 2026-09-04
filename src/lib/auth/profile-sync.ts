import { createClient } from "@insforge/sdk";
import type { DiscordUser, SessionPayload } from "./types";
import type { Role } from "@/lib/services/types";
import { discordAvatarUrl } from "./discord";

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

export async function syncDiscordProfile(discordUser: DiscordUser): Promise<SessionPayload> {
  const avatarUrl = discordAvatarUrl(discordUser.id, discordUser.avatar);
  const displayName = discordUser.global_name ?? discordUser.username;
  const email = discordUser.email ?? `${discordUser.username}@discord.local`;

  const { data: existing } = await insforge.database
    .from("profiles")
    .select("id, role")
    .eq("discord_id", discordUser.id)
    .single();

  if (existing) {
    await insforge.database
      .from("profiles")
      .update({
        name: displayName,
        handle: discordUser.username,
        avatar_url: avatarUrl,
        discord_username: discordUser.username,
        discord_display_name: displayName,
        discord_avatar: avatarUrl,
        discord_email: email,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return {
      profileId: existing.id,
      role: (existing.role as Role) ?? "creator",
      discordId: discordUser.id,
      name: displayName,
      email,
      avatar: avatarUrl,
    };
  }

  const role: Role = "creator";
  const newProfile = {
    name: displayName,
    handle: discordUser.username,
    role,
    bio: "",
    avatar_url: avatarUrl,
    industry: "",
    verified: false,
    status: "active",
    total_views: 0,
    followers: 0,
    lifetime_earnings_minor: 0,
    clips_count: 0,
    engagement_rate: 0,
    discord_id: discordUser.id,
    discord_username: discordUser.username,
    discord_display_name: displayName,
    discord_avatar: avatarUrl,
    discord_email: email,
    last_login_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await insforge.database
    .from("profiles")
    .insert([newProfile])
    .select("id, role")
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);

  return {
    profileId: inserted.id,
    role,
    discordId: discordUser.id,
    name: displayName,
    email,
    avatar: avatarUrl,
  };
}
