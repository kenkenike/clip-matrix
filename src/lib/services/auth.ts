import type { Role } from "@/lib/services/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): void;
  getSession(): SessionUser | null;
}

interface AccountRecord extends SessionUser {
  password: string;
}

const accounts: AccountRecord[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Kaneki",
    email: "kaneki.00@gmail.com",
    role: "admin",
    password: "kaneki",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    name: "Alex Rivera",
    email: "creator@clipmatrix.co",
    role: "creator",
    password: "clipmatrix",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    name: "Nova Media",
    email: "brand@clipmatrix.co",
    role: "brand",
    password: "clipmatrix",
  },
  {
    id: "a0000000-0000-0000-0000-000000000004",
    name: "Sam Torres",
    email: "mod@clipmatrix.co",
    role: "moderator",
    password: "clipmatrix",
  },
];

const SESSION_KEY = "clipmatrix.session";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<SessionUser> {
    await delay(500);
    const normalized = email.trim().toLowerCase();
    const account = accounts.find(
      (a) => a.email.toLowerCase() === normalized && a.password === password
    );
    if (!account) throw new Error("Invalid email or password.");
    const session: SessionUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }

  signOut(): void {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  getSession(): SessionUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SessionUser;
      return parsed && parsed.id && parsed.role ? parsed : null;
    } catch {
      return null;
    }
  }
}

export { MockAuthService };
