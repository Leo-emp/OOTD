// GET /api/pinterest/auth — redirect user to Pinterest OAuth authorization page
// Uses cryptographically random state param to prevent CSRF attacks

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { getPinterestAuthUrl, isPinterestConfigured } from "@/lib/pinterest/client";
import crypto from "crypto";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPinterestConfigured()) {
    return NextResponse.json({ error: "Pinterest integration not configured" }, { status: 503 });
  }

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(32).toString("base64url");

  // Store state in httpOnly cookie — verified in callback
  const cookieStore = await cookies();
  cookieStore.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getPinterestAuthUrl(state));
}
