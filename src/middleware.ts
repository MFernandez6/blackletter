import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe gate only. Do not use `next-auth/middleware` here — it calls
 * `new URL(NEXTAUTH_URL)` on the Edge runtime. An empty or protocol-less
 * value on Vercel crashes with MIDDLEWARE_INVOCATION_FAILED after login.
 *
 * JWT validity is still checked in getServerSession on the Node server.
 */
export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value;

  if (token) return NextResponse.next();

  const login = new URL("/login", req.url);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/templates",
    "/templates/:path*",
    "/generate",
    "/generate/:path*",
    "/claims",
    "/claims/:path*",
    "/tracker",
    "/tracker/:path*",
    "/documents",
    "/documents/:path*",
  ],
};
