// POST /api/cron/pre-generate — nightly batch: pre-generates outfits for active users
// Called by Vercel Cron (schedule in vercel.json) or manually via CRON_SECRET
// Writes to preGeneratedOutfits table — the generate route checks this first for instant display

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, styleProfiles, genreRulesets, preGeneratedOutfits, wardrobeItems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateOutfitsWithFallback } from "@/lib/ai/fallback";
import { smartSearch } from "@/lib/catalog/search";
import { getUserPreferences } from "@/lib/ai/preferences";
import type { CandidateItem } from "@/lib/ai/provider";

export async function POST(request: NextRequest) {
  // Auth check — fail closed
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Pre-Gen Cron] CRON_SECRET not configured — refusing request");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  let usersProcessed = 0;
  let outfitsGenerated = 0;
  const errors: string[] = [];

  // Get all users who have completed the style quiz (have a profile)
  const profiles = await db.query.styleProfiles.findMany({
    columns: { userId: true, primaryGenre: true, activeGenre: true },
  });

  // Process each user — sequential to avoid Gemini rate limits
  for (const profile of profiles) {
    try {
      // Skip if today's outfits already exist for this user
      const existing = await db.query.preGeneratedOutfits.findFirst({
        where: and(
          eq(preGeneratedOutfits.userId, profile.userId),
          eq(preGeneratedOutfits.weatherDate, today),
        ),
      });
      if (existing) continue;

      const genreSlug = profile.activeGenre || profile.primaryGenre;

      // Get genre ruleset
      const genre = await db.query.genreRulesets.findFirst({
        where: eq(genreRulesets.slug, genreSlug),
      });
      if (!genre) continue;

      // Get user's wardrobe items
      const userWardrobe = await db.query.wardrobeItems.findMany({
        where: and(
          eq(wardrobeItems.userId, profile.userId),
          eq(wardrobeItems.status, "ready"),
        ),
      });

      const wardrobeCandidates: CandidateItem[] = userWardrobe
        .filter((w) => {
          const tags = (w.genreTags as string[]) || [];
          return tags.includes(genreSlug) || tags.length === 0;
        })
        .map((w) => ({
          id: w.id,
          name: `My ${w.category || "item"}`,
          brand: "My Wardrobe",
          price: 0,
          category: w.category || "top",
          color: w.color || "unknown",
          genreTags: (w.genreTags as string[]) || [],
          isWardrobe: true,
          imageUrl: w.imageThumbUrl || w.imageUrl,
        }));

      // Get catalog items
      const catalogResults = await smartSearch({
        genreSlug,
        minPrice: genre.priceRange.min,
        maxPrice: genre.priceRange.max,
        limit: 60,
      });

      const catalogCandidates: CandidateItem[] = catalogResults.map((c) => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        price: c.price,
        category: c.category,
        color: c.color,
        genreTags: (c.genreTags as string[]) || [],
      }));

      const allCandidates = [...wardrobeCandidates, ...catalogCandidates];
      if (allCandidates.length < 4) continue;

      // Get preferences
      const preferences = await getUserPreferences(profile.userId);
      const userPrefs = preferences ? {
        preferredColors: (preferences.preferredColors as string[]) || undefined,
        preferredBrands: (preferences.preferredBrands as string[]) || undefined,
        priceSweetSpot: preferences.priceSweetSpot || undefined,
      } : undefined;

      // Generate outfits via AI
      const genreRuleset = {
        ...genre,
        isActive: genre.isActive ?? undefined,
        moodImageUrl: genre.moodImageUrl ?? undefined,
      };

      const result = await generateOutfitsWithFallback(
        {
          genre: genreRuleset,
          candidateItems: allCandidates,
          occasion: "casual",
          userPreferences: userPrefs,
        },
        `pregen:${profile.userId}:${genreSlug}:${today}`
      );

      // Save to DB
      await db.insert(preGeneratedOutfits).values({
        id: nanoid(),
        userId: profile.userId,
        genreId: genre.id,
        weatherDate: today,
        outfitsJson: result.outfits,
      });

      usersProcessed++;
      outfitsGenerated += result.outfits.length;

      // Small delay between users to respect Gemini rate limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      const errMsg = `User ${profile.userId}: ${error instanceof Error ? error.message : "unknown"}`;
      console.error(`[Pre-Gen Cron] ${errMsg}`);
      errors.push(errMsg);
    }
  }

  return NextResponse.json({
    success: true,
    date: today,
    totalUsers: profiles.length,
    usersProcessed,
    outfitsGenerated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
