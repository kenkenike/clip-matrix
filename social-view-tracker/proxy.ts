import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "svt_session";

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const authed = await hasValidSession(req);

  const isAppPath = path === "/app" || path.startsWith("/app/");
  const isAuthPath = path === "/login" || path === "/register";

  if (isAppPath && !authed) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (isAuthPath && authed) {
    return NextResponse.redirect(new URL("/app", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};