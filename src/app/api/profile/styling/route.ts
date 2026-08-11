// POST /api/profile/styling — save body + color profile for personalized outfit generation
// GET /api/profile/styling — load the user's styling profile + seasonal color analysis

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSeasonData, type ColorProfile } from "@/lib/styling/color-theory";

// Validation schema for the styling profile
const StylingProfileSchema = z.object({
  // Body profile
  bodyShape: z.enum(["hourglass", "pear", "apple", "rectangle", "inverted_triangle", "athletic"]),
  height: z.enum(["petite", "average", "tall"]),
  fitPreference: z.enum(["fitted", "relaxed", "oversized"]),
  highlight: z.array(z.string()).max(3).default([]),
  minimize: z.array(z.string()).max(3).default([]),
  // Color profile
  skinDepth: z.enum(["fair", "light", "medium", "olive", "tan", "deep"]),
  undertone: z.enum(["warm", "cool", "neutral"]),
  hairColor: z.enum([
    "black", "dark_brown", "medium_brown", "light_brown",
    "dark_blonde", "medium_blonde", "light_blonde", "red",
    "auburn", "grey", "white",
  ]),
  eyeColor: z.enum(["brown", "hazel", "green", "blue", "grey", "amber", "black"]),
});

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
      return NextResponse.json({ profile: null });
    }

    // Safe parse — if stored JSON is corrupt, return null rather than crash
    let bodyProfile = null;
    if (profile.bodyType) {
      try { bodyProfile = JSON.parse(profile.bodyType); } catch { /* skip corrupt data */ }
    }
    const colorProfile = profile.colorPreferences as unknown as ColorProfile | null;

    // Calculate seasonal analysis if color profile exists
    let seasonalAnalysis = null;
    if (colorProfile?.skinDepth && colorProfile?.undertone && colorProfile?.hairColor && colorProfile?.eyeColor) {
      const { season, data } = getSeasonData(colorProfile);
      seasonalAnalysis = { season, ...data };
    }

    return NextResponse.json({
      profile: {
        body: bodyProfile,
        color: colorProfile,
        seasonalAnalysis,
        primaryGenre: profile.primaryGenre,
        secondaryGenre: profile.secondaryGenre,
      },
    });
  } catch (err) {
    console.error("[API] GET /api/profile/styling failed:", err);
    return NextResponse.json({ error: "Failed to load styling profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof StylingProfileSchema>;
    try {
      body = StylingProfileSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    // Build structured body profile for storage
    const bodyProfile = {
      shape: body.bodyShape,
      height: body.height,
      fitPreference: body.fitPreference,
      highlight: body.highlight,
      minimize: body.minimize,
    };

    // Build color profile for storage + analysis
    const colorProfile: ColorProfile = {
      skinDepth: body.skinDepth,
      undertone: body.undertone,
      hairColor: body.hairColor,
      eyeColor: body.eyeColor,
    };

    // Calculate seasonal type
    const { season, data } = getSeasonData(colorProfile);

    // Update the style profile
    await db
      .update(styleProfiles)
      .set({
        bodyType: JSON.stringify(bodyProfile),
        colorPreferences: colorProfile as unknown as string[],
        updatedAt: new Date().toISOString(),
      })
      .where(eq(styleProfiles.userId, session.user.id));

    return NextResponse.json({
      saved: true,
      seasonalAnalysis: { season, ...data },
    });
  } catch (err) {
    console.error("[API] POST /api/profile/styling failed:", err);
    return NextResponse.json({ error: "Failed to save styling profile" }, { status: 500 });
  }
}
