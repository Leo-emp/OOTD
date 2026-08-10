// Auth guard — redirects unauthenticated users to login, authenticated users away from auth pages
// Next.js 16: proxy.ts replaces deprecated middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/stylist", "/wardrobe", "/discover", "/genres", "/profile", "/outfit"];
// Routes that authenticated users shouldn't see
const AUTH_ROUTES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users to login
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/stylist/:path*",
    "/wardrobe/:path*",
    "/discover/:path*",
    "/genres/:path*",
    "/profile/:path*",
    "/outfit/:path*",
    "/login",
    "/signup",
  ],
};
