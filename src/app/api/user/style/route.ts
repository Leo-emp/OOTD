// GET /api/user/style — returns user's style profile (genres, breakdown)
// Used by profile page to display Style DNA card

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.styleProfiles.findFirst({
      where: eq(styleProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ hasProfile: false });
    }

    return NextResponse.json({
      hasProfile: true,
      primaryGenre: profile.primaryGenre,
      secondaryGenre: profile.secondaryGenre,
      accentGenre: profile.accentGenre,
      activeGenre: profile.activeGenre,
    });
  } catch (err) {
    console.error("[API] GET /api/user/style failed:", err);
    return NextResponse.json({ error: "Failed to fetch style profile" }, { status: 500 });
  }
}
