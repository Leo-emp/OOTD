// GET /api/outfits/generate?genre=old-money&occasion=casual&weather=warm
// Full 7-step pipeline: cache → pre-gen → wardrobe+catalog → preferences → Gemini → rank → response
// Mixes user's wardrobe items with catalog items for personalized outfits

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { genreRulesets, wardrobeItems, preGeneratedOutfits, styleProfiles, outfits as outfitsTable, outfitItems as outfitItemsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { checkRateLimit, outfitRateLimit } from "@/lib/cache/rate-limit";
import { generateOutfitsWithFallback } from "@/lib/ai/fallback";
import { smartSearch } from "@/lib/catalog/search";
import { getUserPreferences } from "@/lib/ai/preferences";
import { getUserPlan } from "@/lib/stripe/plan";
import type { CandidateItem } from "@/lib/ai/provider";
import type { Outfit, OutfitItem } from "@/types/outfit";
import type { BodyProfile } from "@/lib/styling/body-rules";
import type { ColorProfile } from "@/lib/styling/color-theory";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  // Rate limit check — Pro users get higher limits
  const plan = await getUserPlan(session.user.id);
  const { success } = await checkRateLimit(outfitRateLimit[plan], session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Daily outfit limit reached. Upgrade to Pro for 50/day." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const genreSlug = searchParams.get("genre") || "old-money";
  const occasion = searchParams.get("occasion") || "casual";
  const weather = searchParams.get("weather") || undefined;

  // Step 1: Check Redis cache
  const cacheKey = `outfits:${session.user.id}:${genreSlug}:${occasion}:${weather || "any"}`;
  const cached = await cacheGet<Outfit[]>(cacheKey);
  if (cached) {
    return NextResponse.json(
      { outfits: cached, source: "cached" },
      { headers: { "Cache-Control": "private, max-age=120, stale-while-revalidate=600" } }
    );
  }

  // Step 2: Check pre-generated outfits (from nightly cron)
  const today = new Date().toISOString().split("T")[0];
  const preGen = await db.query.preGeneratedOutfits.findFirst({
    where: (pg, { and: a, eq: e }) =>
      a(e(pg.userId, session.user.id), e(pg.weatherDate, today)),
  });
  if (preGen) {
    const preGenOutfits = preGen.outfitsJson as Outfit[];
    await cacheSet(cacheKey, preGenOutfits, 3600);
    return NextResponse.json({ outfits: preGenOutfits, source: "pre-generated" });
  }

  // Step 3: Get genre ruleset from DB
  const genre = await db.query.genreRulesets.findFirst({
    where: eq(genreRulesets.slug, genreSlug),
  });
  if (!genre) {
    return NextResponse.json({ error: "Genre not found" }, { status: 404 });
  }

  // Step 4a: Get user's wardrobe items that match this genre
  // These are clothes the user actually owns — highest priority for outfit building
  const userWardrobe = await db.query.wardrobeItems.findMany({
    where: and(
      eq(wardrobeItems.userId, session.user.id),
      eq(wardrobeItems.status, "ready"),
    ),
  });

  // Filter wardrobe to genre-compatible items
  const wardrobeCandidates: CandidateItem[] = userWardrobe
    .filter((w) => {
      const tags = (w.genreTags as string[]) || [];
      return tags.includes(genreSlug) || tags.length === 0; // include untagged items
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

  // Step 4b: Search catalog for items to complement wardrobe
  const catalogResults = await smartSearch({
    genreSlug,
    minPrice: genre.priceRange.min,
    maxPrice: genre.priceRange.max,
    limit: 80,
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

  // Merge: wardrobe items first (AI sees them as priority), then catalog
  const allCandidates = [...wardrobeCandidates, ...catalogCandidates];

  if (allCandidates.length < 4) {
    return NextResponse.json({ error: "Not enough items for this genre. Try uploading wardrobe items or switching genres." }, { status: 404 });
  }

  // Step 5: Get learned preferences to personalize AI output
  const preferences = await getUserPreferences(session.user.id);
  const userPrefs = preferences ? {
    preferredColors: (preferences.preferredColors as string[]) || undefined,
    preferredBrands: (preferences.preferredBrands as string[]) || undefined,
    priceSweetSpot: preferences.priceSweetSpot || undefined,
  } : undefined;

  // Step 5b: Load body + color profiles for personalized fit/color recs
  const profile = await db.query.styleProfiles.findFirst({
    where: eq(styleProfiles.userId, session.user.id),
  });
  // Safe parse — if stored JSON is corrupt, skip rather than crash
  let bodyProfile: BodyProfile | undefined;
  if (profile?.bodyType) {
    try { bodyProfile = JSON.parse(profile.bodyType); } catch { /* skip corrupt data */ }
  }
  const colorProfile = profile?.colorPreferences
    ? (profile.colorPreferences as unknown as ColorProfile)
    : undefined;

  // Step 6: Generate outfits via Gemini (with 3-tier fallback)
  // Returns discriminated result — either AI format (needs enrichment) or editor's picks (ready to go)
  const genreRuleset = {
    ...genre,
    isActive: genre.isActive ?? undefined,
    moodImageUrl: genre.moodImageUrl ?? undefined,
  };

  const fallbackResult = await generateOutfitsWithFallback(
    {
      genre: genreRuleset,
      candidateItems: allCandidates,
      occasion,
      weather,
      userPreferences: userPrefs,
      bodyProfile,
      colorProfile,
    },
    cacheKey
  );

  // Tier 3 short-circuit — editor's picks come pre-built with full item data
  if (fallbackResult.source === "editors-pick") {
    // Persist so IDs are valid for ratings/saves
    persistOutfits(session.user.id, genre.id, fallbackResult.outfits, "editors-pick").catch((e) =>
      console.error("[Outfits] Editor's picks persist failed:", e)
    );
    return NextResponse.json({ outfits: fallbackResult.outfits, source: "editors-pick" });
  }

  // Step 7: Build response — attach full item data to AI-selected IDs
  // Create lookup maps for both wardrobe and catalog items
  const wardrobeMap = new Map(userWardrobe.map((w) => [w.id, w]));
  const catalogMap = new Map(catalogResults.map((c) => [c.id, c]));

  const responseOutfits: Outfit[] = fallbackResult.aiResponse.outfits.map((aiOutfit) => {
    const items: OutfitItem[] = aiOutfit.items
      .map((aiItem) => {
        // Check wardrobe first, then catalog
        const wardrobeItem = wardrobeMap.get(aiItem.catalogItemId);
        if (wardrobeItem) {
          return {
            itemId: wardrobeItem.id,
            itemType: "wardrobe" as const,
            position: aiItem.position,
            name: `My ${wardrobeItem.category || "item"}`,
            brand: "My Wardrobe",
            price: 0,
            imageUrl: wardrobeItem.imageThumbUrl || wardrobeItem.imageUrl,
            affiliateUrl: "",
            color: wardrobeItem.color || "",
          };
        }

        const catalogItem = catalogMap.get(aiItem.catalogItemId);
        if (catalogItem) {
          return {
            itemId: catalogItem.id,
            itemType: "catalog" as const,
            position: aiItem.position,
            name: catalogItem.name,
            brand: catalogItem.brand,
            price: catalogItem.price,
            imageUrl: (catalogItem.imageUrls as string[])?.[0] || "",
            affiliateUrl: catalogItem.affiliateUrl,
            color: catalogItem.color,
          };
        }

        return null;
      })
      .filter(Boolean) as OutfitItem[];

    const totalPrice = items
      .filter((i) => i.itemType === "catalog")
      .reduce((sum, item) => sum + (item.price || 0), 0);

    return {
      id: nanoid(),
      genreSlug,
      occasion: occasion as Outfit["occasion"],
      weather: weather as Outfit["weather"],
      items,
      styleExplanation: aiOutfit.styleExplanation,
      totalPrice,
      source: fallbackResult.source as Outfit["source"],
    };
  });

  // Persist outfits + items to DB (fire-and-forget — don't block response)
  // This makes outfit IDs valid for ratings, saved outfits, and history
  persistOutfits(session.user.id, genre.id, responseOutfits, fallbackResult.source).catch((e) =>
    console.error("[Outfits] DB persist failed:", e)
  );

  // Cache the result for 1 hour
  await cacheSet(cacheKey, responseOutfits, 3600);

  return NextResponse.json(
    { outfits: responseOutfits, source: fallbackResult.source },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } }
  );
  } catch (err) {
    console.error("[API] GET /api/outfits/generate failed:", err);
    return NextResponse.json({ error: "Failed to generate outfits" }, { status: 500 });
  }
}

// Save generated outfits to the DB so IDs are valid for ratings/saves/history
async function persistOutfits(
  userId: string,
  genreId: string,
  outfits: Outfit[],
  source: string,
) {
  for (const outfit of outfits) {
    // Insert the outfit row
    await db.insert(outfitsTable).values({
      id: outfit.id,
      userId,
      genreId,
      occasion: outfit.occasion,
      weather: outfit.weather,
      styleExplanation: outfit.styleExplanation,
      source,
    }).onConflictDoNothing();

    // Insert each item in the outfit
    for (const item of outfit.items) {
      await db.insert(outfitItemsTable).values({
        id: nanoid(),
        outfitId: outfit.id,
        itemId: item.itemId,
        itemType: item.itemType,
        position: item.position,
      }).onConflictDoNothing();
    }
  }
}
