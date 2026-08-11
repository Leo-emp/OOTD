// GET /api/style-evolution — get monthly genre preference snapshots for timeline
// POST /api/style-evolution — trigger a snapshot capture for the current month

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleSnapshots, styleStreaks, outfitRatings, outfits } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all snapshots for this user, ordered by month
    const snapshots = await db.query.styleSnapshots.findMany({
      where: eq(styleSnapshots.userId, session.user.id),
      orderBy: styleSnapshots.month,
    });

    return NextResponse.json({ snapshots });
  } catch (err) {
    console.error("[API] GET /api/style-evolution failed:", err);
    return NextResponse.json({ error: "Failed to load style evolution" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if snapshot already exists for this month
    const existing = await db.query.styleSnapshots.findFirst({
      where: and(
        eq(styleSnapshots.userId, session.user.id),
        eq(styleSnapshots.month, currentMonth),
      ),
    });

    // Build genre breakdown from streaks this month
    const monthStart = `${currentMonth}-01`;
    const monthEnd = `${currentMonth}-31`;

    const monthStreaks = await db.query.styleStreaks.findMany({
      where: and(
        eq(styleStreaks.userId, session.user.id),
        gte(styleStreaks.date, monthStart),
        lte(styleStreaks.date, monthEnd),
      ),
    });

    // Also count genre usage from outfit ratings (loves only)
    const monthRatings = await db.query.outfitRatings.findMany({
      where: and(
        eq(outfitRatings.userId, session.user.id),
        eq(outfitRatings.rating, "love"),
      ),
      orderBy: desc(outfitRatings.createdAt),
      limit: 100,
    });

    // Get genre IDs from loved outfits — need to look up the outfit to get genreId
    const lovedOutfitIds = monthRatings.map((r) => r.outfitId);
    const lovedOutfits = lovedOutfitIds.length > 0
      ? await db.query.outfits.findMany({
          where: and(
            eq(outfits.userId, session.user.id),
          ),
          limit: 200,
        })
      : [];

    // Count genres from both streaks and loved outfits
    const genreCounts: Record<string, number> = {};

    // From streaks (direct genre logging)
    for (const streak of monthStreaks) {
      if (streak.genreSlug) {
        genreCounts[streak.genreSlug] = (genreCounts[streak.genreSlug] || 0) + 2;
      }
    }

    // From loved outfits
    // genreId maps to genre rulesets, but we need slug — use the outfit data we have
    const lovedOutfitSet = new Set(lovedOutfitIds);
    for (const outfit of lovedOutfits) {
      if (lovedOutfitSet.has(outfit.id) && outfit.genreId) {
        genreCounts[outfit.genreId] = (genreCounts[outfit.genreId] || 0) + 1;
      }
    }

    // Convert to percentages
    const total = Object.values(genreCounts).reduce((a, b) => a + b, 0);
    const genreBreakdown: Record<string, number> = {};
    if (total > 0) {
      for (const [genre, count] of Object.entries(genreCounts)) {
        genreBreakdown[genre] = Math.round((count / total) * 100);
      }
    }

    // Determine top genre
    const topGenre = Object.entries(genreBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || "unknown";

    const totalOutfits = monthStreaks.length;

    if (existing) {
      // Update existing snapshot
      await db
        .update(styleSnapshots)
        .set({ genreBreakdown, totalOutfits, topGenre })
        .where(eq(styleSnapshots.id, existing.id));
    } else {
      // Create new snapshot
      await db.insert(styleSnapshots).values({
        id: nanoid(),
        userId: session.user.id,
        month: currentMonth,
        genreBreakdown,
        totalOutfits,
        topGenre,
      });
    }

    return NextResponse.json({
      captured: true,
      month: currentMonth,
      genreBreakdown,
      topGenre,
      totalOutfits,
    });
  } catch (err) {
    console.error("[API] POST /api/style-evolution failed:", err);
    return NextResponse.json({ error: "Failed to capture style snapshot" }, { status: 500 });
  }
}
