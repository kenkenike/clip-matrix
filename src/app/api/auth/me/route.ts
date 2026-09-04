import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.profileId,
      discordId: session.discordId,
      username: session.name,
      displayName: session.name,
      email: session.email,
      avatar: session.avatar,
      role: session.role,
    },
  });
}
