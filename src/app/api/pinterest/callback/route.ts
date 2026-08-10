// GET /api/pinterest/callback — OAuth callback from Pinterest
// Verifies CSRF state, exchanges auth code for access token, stores in DB

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { exchangeCodeForToken } from "@/lib/pinterest/client";
import { db } from "@/lib/db";
import { pinterestConnections } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/pinterest?error=denied", request.url));
  }

  // Verify CSRF state matches the cookie set during auth initiation
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("pinterest_oauth_state")?.value;
  cookieStore.delete("pinterest_oauth_state");

  if (!expectedState || !state || expectedState !== state) {
    return NextResponse.redirect(new URL("/pinterest?error=state", request.url));
  }

  try {
    const accessToken = await exchangeCodeForToken(code);

    await db.insert(pinterestConnections).values({
      id: nanoid(),
      userId: session.user.id,
      accessToken,
    }).onConflictDoNothing();

    return NextResponse.redirect(new URL("/pinterest?connected=true", request.url));
  } catch (err) {
    console.error("[Pinterest] Token exchange failed:", err);
    return NextResponse.redirect(new URL("/pinterest?error=token", request.url));
  }
}
