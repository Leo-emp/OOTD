// Preference learning engine — learns user style from outfit ratings
// Pure code-based scoring (no LLM calls) — fast, predictable, cheap
// Tracks: preferred colors, brands, price sweet spot, category weights

import { db } from "@/lib/db";
import { outfitRatings, outfitItems, catalogItems, userPreferencesLearned } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

// Weights for different rating types
const RATING_WEIGHTS = {
  love: 1.0,   // strong positive signal
  skip: -0.2,  // mild negative — they might just not need it today
  hate: -1.0,  // strong negative signal
};

// Recalculate preferences from all ratings (called after each new rating)
export async function updateUserPreferences(userId: string): Promise<void> {
  // Get all ratings for this user
  const ratings = await db.query.outfitRatings.findMany({
    where: eq(outfitRatings.userId, userId),
  });

  if (ratings.length < 3) return; // need minimum data to learn from

  // Get the outfit items for each rated outfit
  const outfitIds = ratings.map((r) => r.outfitId);
  const items = await db.query.outfitItems.findMany({
    where: inArray(outfitItems.outfitId, outfitIds),
  });

  // Get catalog data for those items
  const itemIds = items.map((i) => i.itemId);
  const catalog = await db.query.catalogItems.findMany({
    where: inArray(catalogItems.id, itemIds),
  });

  // Build a map of outfitId → rating weight
  const outfitWeights = new Map<string, number>();
  for (const r of ratings) {
    outfitWeights.set(r.outfitId, RATING_WEIGHTS[r.rating as keyof typeof RATING_WEIGHTS] || 0);
  }

  // Build a map of itemId → catalog data
  const catalogMap = new Map(catalog.map((c) => [c.id, c]));

  // Score accumulators
  const colorScores = new Map<string, number>();
  const brandScores = new Map<string, number>();
  let priceSum = 0;
  let priceCount = 0;

  // Process each outfit item, weighted by the outfit's rating
  for (const item of items) {
    const weight = outfitWeights.get(item.outfitId) || 0;
    const catalogItem = catalogMap.get(item.itemId);
    if (!catalogItem) continue;

    // Color preference
    const color = catalogItem.color;
    colorScores.set(color, (colorScores.get(color) || 0) + weight);

    // Brand preference
    const brand = catalogItem.brand;
    brandScores.set(brand, (brandScores.get(brand) || 0) + weight);

    // Price tracking (only from loved outfits)
    if (weight > 0) {
      priceSum += catalogItem.price;
      priceCount++;
    }
  }

  // Extract top preferences — colors and brands with positive scores
  const preferredColors = [...colorScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color);

  const preferredBrands = [...brandScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand]) => brand);

  const priceSweetSpot = priceCount > 0 ? Math.round(priceSum / priceCount) : null;

  // Build a simple style vector (12-dim, one per genre)
  // This could be used for similarity search later
  const genreSlugs = [
    "old-money", "y2k", "streetwear", "minimalist",
    "cottagecore", "dark-academia", "coastal-grandma", "grunge",
    "coquette", "gorpcore", "clean-girl", "indie-boho",
  ];
  const styleVector = genreSlugs.map((genre) => {
    let score = 0;
    for (const item of items) {
      const catalogItem = catalogMap.get(item.itemId);
      if (!catalogItem) continue;
      const tags = catalogItem.genreTags as string[] | null;
      if (tags?.includes(genre)) {
        score += outfitWeights.get(item.outfitId) || 0;
      }
    }
    return Math.round(score * 100) / 100; // 2 decimal places
  });

  // Upsert preferences
  const existing = await db.query.userPreferencesLearned.findFirst({
    where: eq(userPreferencesLearned.userId, userId),
  });

  if (existing) {
    await db
      .update(userPreferencesLearned)
      .set({
        preferredColors,
        preferredBrands,
        priceSweetSpot,
        styleVector,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userPreferencesLearned.id, existing.id));
  } else {
    await db.insert(userPreferencesLearned).values({
      id: nanoid(),
      userId,
      preferredColors,
      preferredBrands,
      priceSweetSpot,
      styleVector,
    });
  }
}

// Get user preferences for outfit generation (used by AI prompts)
export async function getUserPreferences(userId: string) {
  return db.query.userPreferencesLearned.findFirst({
    where: eq(userPreferencesLearned.userId, userId),
  });
}
