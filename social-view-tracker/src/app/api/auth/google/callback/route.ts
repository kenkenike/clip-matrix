import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode, upsertGoogleUser } from "@/lib/auth-google";
import {
  decryptSession,
  readTransientCookie,
  deleteTransientCookie,
  setSessionCookie,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const dest = new URL("/login", request.nextUrl);

  if (error) {
    dest.searchParams.set("error", "google-denied");
    return NextResponse.redirect(dest);
  }
  if (!code || !state) {
    dest.searchParams.set("error", "google-invalid");
    return NextResponse.redirect(dest);
  }

  try {
    const stateToken = await readTransientCookie("svt_oauth_state");
    if (stateToken) {
      const payload = await decryptSession(stateToken);
      const { redirectTo } = payload as { state?: string; redirectTo?: string };
      if (redirectTo && redirectTo.startsWith("/")) {
        dest.pathname = redirectTo;
      }
    }
    await deleteTransientCookie("svt_oauth_state");

    const userInfo = await exchangeGoogleCode(code);
    const user = await upsertGoogleUser(userInfo);
    await setSessionCookie({ userId: user.id });
    return NextResponse.redirect(new URL("/app", request.nextUrl));
  } catch (err) {
    dest.searchParams.set("error", "google-failed");
    void err;
    return NextResponse.redirect(dest);
  }
}