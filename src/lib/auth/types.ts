import type { Role } from "@/lib/services/types";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface SessionPayload {
  profileId: string;
  role: Role;
  discordId: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface AuthUser {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string | null;
  role: Role;
}
