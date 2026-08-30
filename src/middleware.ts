import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/login")) return true;
        if (path.startsWith("/api/webhooks")) return true;
        if (path.startsWith("/api/next-document")) return true;
        if (path.startsWith("/api/documents/by-intake")) return true;
        if (path.startsWith("/api/claims") && path.endsWith("/next")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/templates/:path*",
    "/generate/:path*",
    "/claims/:path*",
    "/tracker/:path*",
    "/documents/:path*",
    "/api/next-document",
    "/api/claims/:path*",
  ],
};
