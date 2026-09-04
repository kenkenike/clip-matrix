import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizationUrl } from "@/lib/auth/discord";

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  const state = generateState();

  const store = await cookies();
  store.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const url = buildAuthorizationUrl(state);
  return NextResponse.redirect(url);
}
