// Hybrid catalog search — tries live API for fresh results, falls back to local DB cache
// Ensures smooth UX: local cache serves instantly, background refresh keeps data fresh

import { db } from "@/lib/db";
import { catalogItems } from "@/lib/db/schema";
import { and, eq, gte, lte, like, sql } from "drizzle-orm";
import { shopStyleAdapter } from "./shopstyle";
import { syncGenre, isGenreStale } from "./sync";

// Search the local catalog cache — fast, always available
export async function searchCatalog(params: {
  genreSlug: string;
  category?: string;
  season?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  brand?: string;
}) {
  const { genreSlug, category, season, minPrice, maxPrice, limit = 50, brand } = params;

  // Build filter conditions dynamically
  const conditions = [
    eq(catalogItems.inStock, true),
    // Genre tag match — JSON array contains the slug
    like(catalogItems.genreTags, `%"${genreSlug}"%`),
  ];
  if (category) conditions.push(eq(catalogItems.category, category));
  if (season) conditions.push(eq(catalogItems.season, season));
  if (minPrice !== undefined) conditions.push(gte(catalogItems.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(catalogItems.price, maxPrice));
  if (brand) conditions.push(eq(catalogItems.brand, brand));

  const items = await db.query.catalogItems.findMany({
    where: and(...conditions),
    limit,
    // Randomize order so users get variety, not the same 50 every time
    orderBy: sql`RANDOM()`,
  });

  return items;
}

// Smart search — checks if cache is fresh, triggers background sync if stale
// Returns results immediately from cache while syncing in background
export async function smartSearch(params: {
  genreSlug: string;
  category?: string;
  season?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  brand?: string;
}) {
  // Step 1: Always serve from local cache first (instant response)
  const cachedResults = await searchCatalog(params);

  // Step 2: If cache has enough items, return immediately
  // Trigger background refresh if stale (doesn't block response)
  if (cachedResults.length >= 10) {
    // Non-blocking background sync if cache is stale
    isGenreStale(params.genreSlug).then((stale) => {
      if (stale) {
        console.log(`[Search] Background sync triggered for stale genre: ${params.genreSlug}`);
        syncGenre(params.genreSlug).catch((e) =>
          console.error(`[Search] Background sync failed: ${e}`)
        );
      }
    });

    return cachedResults;
  }

  // Step 3: Cache is cold or too few results — try ShopStyle API directly
  if (shopStyleAdapter.isConfigured()) {
    console.log(`[Search] Cache cold for ${params.genreSlug}, fetching from ShopStyle...`);

    // Sync this genre first, then re-query
    const synced = await syncGenre(params.genreSlug);
    if (synced > 0) {
      return searchCatalog(params);
    }
  }

  // Step 4: Return whatever we have (could be the demo seed)
  return cachedResults;
}

// Search across ALL genres — for discovery/explore features
export async function searchAllGenres(params: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}) {
  const { category, minPrice, maxPrice, limit = 100 } = params;

  const conditions = [eq(catalogItems.inStock, true)];
  if (category) conditions.push(eq(catalogItems.category, category));
  if (minPrice !== undefined) conditions.push(gte(catalogItems.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(catalogItems.price, maxPrice));

  return db.query.catalogItems.findMany({
    where: and(...conditions),
    limit,
    orderBy: sql`RANDOM()`,
  });
}

// Get all available brands for a genre (for filter UI)
// Uses SELECT DISTINCT instead of fetching all rows then deduplicating in JS
export async function getGenreBrands(genreSlug: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ brand: catalogItems.brand })
    .from(catalogItems)
    .where(and(
      eq(catalogItems.inStock, true),
      like(catalogItems.genreTags, `%"${genreSlug}"%`)
    ))
    .orderBy(catalogItems.brand);

  return rows.map((r) => r.brand);
}

// Get price range for a genre (for filter UI slider)
// Uses MIN/MAX aggregation instead of fetching all prices into JS
export async function getGenrePriceRange(genreSlug: string): Promise<{ min: number; max: number }> {
  const result = await db
    .select({
      minPrice: sql<number>`MIN(${catalogItems.price})`,
      maxPrice: sql<number>`MAX(${catalogItems.price})`,
    })
    .from(catalogItems)
    .where(and(
      eq(catalogItems.inStock, true),
      like(catalogItems.genreTags, `%"${genreSlug}"%`)
    ));

  const row = result[0];
  if (!row?.minPrice && !row?.maxPrice) return { min: 0, max: 500 };

  return {
    min: Math.floor(row.minPrice ?? 0),
    max: Math.ceil(row.maxPrice ?? 500),
  };
}

// Count items per genre (for dashboard stats)
// Single query with conditional counts instead of 12 separate queries (N+1 fix)
export async function getCatalogStats(): Promise<Record<string, number>> {
  const genres = [
    "old-money", "y2k", "streetwear", "minimalist",
    "cottagecore", "dark-academia", "coastal-grandma", "grunge",
    "coquette", "gorpcore", "clean-girl", "indie-boho",
  ] as const;

  // Single query: count per genre using conditional SUM
  const rows = await db
    .select({
      genreTags: catalogItems.genreTags,
    })
    .from(catalogItems)
    .where(eq(catalogItems.inStock, true));

  // Count in-memory — 1 query instead of 12
  const stats: Record<string, number> = {};
  for (const genre of genres) {
    stats[genre] = 0;
  }
  for (const row of rows) {
    const tags = JSON.stringify(row.genreTags);
    for (const genre of genres) {
      if (tags.includes(`"${genre}"`)) {
        stats[genre]++;
      }
    }
  }

  return stats;
}
