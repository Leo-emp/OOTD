import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { genreRulesets, outfits, outfitItems, preGeneratedOutfits, catalogItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { checkRateLimit, outfitRateLimit } from "@/lib/cache/rate-limit";
import { generateOutfitsWithFallback } from "@/lib/ai/fallback";
import { searchCatalog } from "@/lib/catalog/search";
import type { Outfit, OutfitItem } from "@/types/outfit";

// GET /api/outfits/generate?genre=old-money&occasion=casual&weather=warm
// Full 6-step pipeline: cache → pre-gen → catalog → Gemini → rank → response
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const plan = "free"; // TODO: check subscription
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
    return NextResponse.json({ outfits: cached, source: "cached" });
  }

  // Step 2: Check pre-generated outfits (from nightly cron)
  const today = new Date().toISOString().split("T")[0];
  const preGen = await db.query.preGeneratedOutfits.findFirst({
    where: (pg, { and, eq }) =>
      and(eq(pg.userId, session.user.id), eq(pg.weatherDate, today)),
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

  // Step 4: Search catalog for candidate items
  const candidates = await searchCatalog({
    genreSlug,
    minPrice: genre.priceRange.min,
    maxPrice: genre.priceRange.max,
    limit: 100,
  });

  if (candidates.length < 4) {
    return NextResponse.json({ error: "Not enough items in catalog for this genre" }, { status: 404 });
  }

  // Step 5: Generate outfits via Gemini (with 3-tier fallback)
  const candidateItems = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    price: c.price,
    category: c.category,
    color: c.color,
    genreTags: (c.genreTags as string[]) || [],
  }));

  // Convert DB null values to undefined for type compat
  const genreRuleset = { ...genre, isActive: genre.isActive ?? undefined, moodImageUrl: genre.moodImageUrl ?? undefined };

  const aiResult = await generateOutfitsWithFallback(
    { genre: genreRuleset, candidateItems, occasion, weather },
    cacheKey
  );

  // Step 6: Build response — attach full item data to AI-selected IDs
  const responseOutfits: Outfit[] = aiResult.outfits.map((aiOutfit) => {
    const items: OutfitItem[] = aiOutfit.items
      .map((aiItem) => {
        const catalogItem = candidates.find((c) => c.id === aiItem.catalogItemId);
        if (!catalogItem) return null;
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
      })
      .filter(Boolean) as OutfitItem[];

    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

    return {
      id: nanoid(),
      genreSlug,
      occasion: occasion as Outfit["occasion"],
      weather: weather as Outfit["weather"],
      items,
      styleExplanation: aiOutfit.styleExplanation,
      totalPrice,
      source: "ai" as const,
    };
  });

  // Cache the result for 1 hour
  await cacheSet(cacheKey, responseOutfits, 3600);

  return NextResponse.json({ outfits: responseOutfits, source: "ai" });
}
