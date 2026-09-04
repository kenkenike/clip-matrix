import type { Role } from "@/lib/services/types";

export interface CurrentUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

let cachedUser: CurrentUser | null = null;
let cachePromise: Promise<CurrentUser | null> | null = null;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (cachedUser) return cachedUser;

  if (cachePromise) return cachePromise;

  cachePromise = fetch("/api/auth/me")
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.authenticated) return null;
      const user: CurrentUser = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.displayName,
        email: data.user.email,
      };
      cachedUser = user;
      return user;
    })
    .catch(() => null);

  return cachePromise;
}

export function clearUserCache() {
  cachedUser = null;
  cachePromise = null;
}
