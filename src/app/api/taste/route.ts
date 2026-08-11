// GET /api/taste — get user's computed taste profile
// POST /api/taste — trigger recomputation

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { tasteProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { computeTasteProfile, saveTasteProfile } from "@/lib/ai/taste";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taste = await db.query.tasteProfiles.findFirst({
      where: eq(tasteProfiles.userId, session.user.id),
    });

    if (!taste) {
      return NextResponse.json({ taste: null, message: "No taste profile yet. Rate some outfits to build yours." });
    }

    return NextResponse.json({
      taste: {
        colorAffinities: taste.colorAffinities,
        brandAffinities: taste.brandAffinities,
        genreWeights: taste.genreWeights,
        priceRange: { min: taste.priceMin, max: taste.priceMax, mean: taste.priceMean },
        dimensions: {
          formalityCasual: taste.formalityCasual,
          boldnessMinimal: taste.boldnessMinimal,
          trendClassic: taste.trendClassic,
        },
        confidence: taste.totalInteractions || 0,
        lastComputed: taste.lastComputed,
      },
    });
  } catch (err) {
    console.error("[API] GET /api/taste failed:", err);
    return NextResponse.json({ error: "Failed to load taste profile" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Compute taste from all behavioral data
    const taste = await computeTasteProfile(session.user.id);

    // Save to DB
    await saveTasteProfile(session.user.id, taste);

    return NextResponse.json({
      computed: true,
      taste: {
        genreWeights: taste.genreWeights,
        dimensions: {
          formalityCasual: taste.formalityCasual,
          boldnessMinimal: taste.boldnessMinimal,
          trendClassic: taste.trendClassic,
        },
        confidence: taste.totalInteractions,
      },
    });
  } catch (err) {
    console.error("[API] POST /api/taste failed:", err);
    return NextResponse.json({ error: "Failed to compute taste profile" }, { status: 500 });
  }
}
