// Taste Graph Engine — computes personalized taste profile from all user interactions
// This is the proprietary moat: after 3 months, we know the user better than any new app

import { db } from "@/lib/db";
import { outfitRatings, outfits, outfitItems, catalogItems, wardrobeItems, styleStreaks, tasteProfiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Genre-to-style-dimension mappings — how each genre maps to taste axes
const GENRE_DIMENSIONS: Record<string, { formality: number; boldness: number; trend: number }> = {
  "old-money":       { formality: 0.2, boldness: 0.8, trend: 0.9 },
  "minimalist":      { formality: 0.4, boldness: 0.9, trend: 0.5 },
  "streetwear":      { formality: 0.9, boldness: 0.1, trend: 0.2 },
  "cottagecore":     { formality: 0.6, boldness: 0.6, trend: 0.4 },
  "dark-academia":   { formality: 0.3, boldness: 0.5, trend: 0.7 },
  "y2k":             { formality: 0.7, boldness: 0.1, trend: 0.1 },
  "coastal-grandma": { formality: 0.5, boldness: 0.7, trend: 0.8 },
  "grunge":          { formality: 0.8, boldness: 0.2, trend: 0.5 },
  "coquette":        { formality: 0.5, boldness: 0.4, trend: 0.3 },
  "gorpcore":        { formality: 0.9, boldness: 0.5, trend: 0.3 },
  "clean-girl":      { formality: 0.4, boldness: 0.7, trend: 0.4 },
  "indie-boho":      { formality: 0.7, boldness: 0.3, trend: 0.5 },
};

// Rating weights — loves matter 3x more than skips
const RATING_WEIGHTS: Record<string, number> = { love: 3, skip: 0, hate: -2 };

export interface TasteProfile {
  colorAffinities: Record<string, number>;
  brandAffinities: Record<string, number>;
  genreWeights: Record<string, number>;
  priceMin: number;
  priceMax: number;
  priceMean: number;
  formalityCasual: number;
  boldnessMinimal: number;
  trendClassic: number;
  totalInteractions: number;
}

// Compute taste profile from all user behavior data
export async function computeTasteProfile(userId: string): Promise<TasteProfile> {
  // 1. Gather all ratings with their outfit details
  const ratings = await db.query.outfitRatings.findMany({
    where: eq(outfitRatings.userId, userId),
    orderBy: desc(outfitRatings.createdAt),
    limit: 500,
  });

  // 2. Get outfit details for rated outfits
  const ratedOutfitIds = ratings.map((r) => r.outfitId);
  const ratedOutfits = ratedOutfitIds.length > 0
    ? await db.query.outfits.findMany({
        where: eq(outfits.userId, userId),
      })
    : [];
  const outfitMap = new Map(ratedOutfits.map((o) => [o.id, o]));

  // 3. Get items for rated outfits (for color/brand/price extraction)
  const allOutfitItems = ratedOutfitIds.length > 0
    ? await db.query.outfitItems.findMany({
        where: eq(outfitItems.outfitId, ratedOutfitIds[0]),
      })
    : [];

  // 4. Get streak data (genre preferences from daily logging)
  const streaks = await db.query.styleStreaks.findMany({
    where: eq(styleStreaks.userId, userId),
    orderBy: desc(styleStreaks.date),
    limit: 90,
  });

  // 5. Get user's wardrobe items (color/brand preferences from what they own)
  const wardrobe = await db.query.wardrobeItems.findMany({
    where: and(eq(wardrobeItems.userId, userId), eq(wardrobeItems.status, "ready")),
  });

  // Initialize accumulators
  const colorCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};
  const prices: number[] = [];
  let formalitySum = 0;
  let boldnessSum = 0;
  let trendSum = 0;
  let dimensionCount = 0;
  let totalInteractions = 0;

  // Process ratings — strongest signal
  for (const rating of ratings) {
    const weight = RATING_WEIGHTS[rating.rating] ?? 0;
    const outfit = outfitMap.get(rating.outfitId);
    if (!outfit) continue;

    totalInteractions++;

    // Genre signal from rated outfit
    if (outfit.genreId) {
      genreCounts[outfit.genreId] = (genreCounts[outfit.genreId] || 0) + weight;
    }

    // Style dimensions
    const dims = GENRE_DIMENSIONS[outfit.genreId];
    if (dims && weight > 0) {
      formalitySum += dims.formality * weight;
      boldnessSum += dims.boldness * weight;
      trendSum += dims.trend * weight;
      dimensionCount += weight;
    }
  }

  // Process streaks — medium signal (user actively chose to log this genre)
  for (const streak of streaks) {
    if (streak.genreSlug) {
      genreCounts[streak.genreSlug] = (genreCounts[streak.genreSlug] || 0) + 2;
      totalInteractions++;

      const dims = GENRE_DIMENSIONS[streak.genreSlug];
      if (dims) {
        formalitySum += dims.formality * 2;
        boldnessSum += dims.boldness * 2;
        trendSum += dims.trend * 2;
        dimensionCount += 2;
      }
    }
  }

  // Process wardrobe — passive signal (what they already own reflects taste)
  for (const item of wardrobe) {
    if (item.color) {
      colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
    }
    const tags = (item.genreTags as string[]) || [];
    for (const tag of tags) {
      genreCounts[tag] = (genreCounts[tag] || 0) + 1;
    }
    totalInteractions++;
  }

  // Normalize genre counts to 0-100 weights
  const maxGenre = Math.max(...Object.values(genreCounts), 1);
  const genreWeights: Record<string, number> = {};
  for (const [genre, count] of Object.entries(genreCounts)) {
    genreWeights[genre] = Math.round((count / maxGenre) * 100);
  }

  // Normalize color affinities
  const maxColor = Math.max(...Object.values(colorCounts), 1);
  const colorAffinities: Record<string, number> = {};
  for (const [color, count] of Object.entries(colorCounts)) {
    colorAffinities[color] = Math.round((count / maxColor) * 100);
  }

  // Normalize brand affinities
  const maxBrand = Math.max(...Object.values(brandCounts), 1);
  const brandAffinities: Record<string, number> = {};
  for (const [brand, count] of Object.entries(brandCounts)) {
    brandAffinities[brand] = Math.round((count / maxBrand) * 100);
  }

  // Calculate price range
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
  const priceMax = prices.length > 0 ? Math.max(...prices) : 200;
  const priceMean = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 50;

  // Calculate style dimensions (default to 0.5 if no data)
  const formalityCasual = dimensionCount > 0 ? formalitySum / dimensionCount : 0.5;
  const boldnessMinimal = dimensionCount > 0 ? boldnessSum / dimensionCount : 0.5;
  const trendClassic = dimensionCount > 0 ? trendSum / dimensionCount : 0.5;

  return {
    colorAffinities,
    brandAffinities,
    genreWeights,
    priceMin,
    priceMax,
    priceMean,
    formalityCasual: Math.round(formalityCasual * 100) / 100,
    boldnessMinimal: Math.round(boldnessMinimal * 100) / 100,
    trendClassic: Math.round(trendClassic * 100) / 100,
    totalInteractions,
  };
}

// Save computed taste profile to DB
export async function saveTasteProfile(userId: string, taste: TasteProfile): Promise<void> {
  const existing = await db.query.tasteProfiles.findFirst({
    where: eq(tasteProfiles.userId, userId),
  });

  const data = {
    colorAffinities: taste.colorAffinities,
    brandAffinities: taste.brandAffinities,
    genreWeights: taste.genreWeights,
    priceMin: taste.priceMin,
    priceMax: taste.priceMax,
    priceMean: taste.priceMean,
    formalityCasual: taste.formalityCasual,
    boldnessMinimal: taste.boldnessMinimal,
    trendClassic: taste.trendClassic,
    totalInteractions: taste.totalInteractions,
    lastComputed: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await db.update(tasteProfiles).set(data).where(eq(tasteProfiles.id, existing.id));
  } else {
    await db.insert(tasteProfiles).values({ id: nanoid(), userId, ...data });
  }
}
