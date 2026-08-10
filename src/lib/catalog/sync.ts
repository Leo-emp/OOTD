// Catalog sync service — fetches products from ShopStyle API and caches in local DB
// Runs on cron (nightly) or triggered by genre browse when cache is cold
// Ensures smooth UX: users never wait for API — we serve from cache, refresh in background

import { db } from "@/lib/db";
import { catalogItems } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { shopStyleAdapter } from "./shopstyle";
import type { NormalizedCatalogItem } from "./provider";

// How long cached items are considered fresh (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Assign genre tags to a product based on its attributes
// Maps real product characteristics to our 12 genre system
function assignGenreTags(item: NormalizedCatalogItem, primaryGenre: string): string[] {
  const tags = [primaryGenre];
  const brand = item.brand.toLowerCase();
  const name = item.name.toLowerCase();
  const price = item.price;

  // Cross-genre tagging — many items fit multiple aesthetics
  // A COS blazer is both minimalist AND old-money
  if (price > 100 && !name.match(/graphic|distressed|ripped/)) {
    if (!tags.includes("old-money")) tags.push("old-money");
  }
  if (name.match(/linen|floral|knit|cardigan/) && !tags.includes("cottagecore")) {
    tags.push("cottagecore");
  }
  if (name.match(/oversized|hoodie|sneaker|graphic/) && !tags.includes("streetwear")) {
    tags.push("streetwear");
  }
  if (brand.match(/cos|everlane|uniqlo|arket/) && !tags.includes("minimalist")) {
    tags.push("minimalist");
  }
  if (name.match(/flannel|combat|distressed|ripped/) && !tags.includes("grunge")) {
    tags.push("grunge");
  }
  if (name.match(/puffer|trail|fleece|windbreaker/) && !tags.includes("gorpcore")) {
    tags.push("gorpcore");
  }
  if (name.match(/lace|bow|ribbon|ballet/) && !tags.includes("coquette")) {
    tags.push("coquette");
  }
  if (name.match(/matching|set|bodycon|gold/) && !tags.includes("clean-girl")) {
    tags.push("clean-girl");
  }

  return tags;
}

// Infer season from product name and category
function inferSeason(item: NormalizedCatalogItem): string {
  const name = item.name.toLowerCase();

  if (name.match(/puffer|wool|cashmere|fleece|thermal|sherpa/)) return "winter";
  if (name.match(/linen|tank|sandal|shorts|sleeveless/)) return "summer";
  if (name.match(/rain|light jacket|windbreaker|layer/)) return "spring";
  if (name.match(/suede|corduroy|knit|tweed/)) return "fall";

  return "all";
}

// Upsert a single product into the local catalog cache
async function upsertCatalogItem(item: NormalizedCatalogItem, genreSlug: string) {
  // Check if this product already exists in our DB
  const existing = await db.query.catalogItems.findFirst({
    where: and(
      eq(catalogItems.source, "shopstyle"),
      eq(catalogItems.externalId, item.externalId)
    ),
  });

  const genreTags = assignGenreTags(item, genreSlug);
  const season = inferSeason(item);

  if (existing) {
    // Update price, stock status, and sync timestamp
    await db
      .update(catalogItems)
      .set({
        price: item.price,
        inStock: true,
        imageUrls: item.imageUrls,
        lastSynced: new Date().toISOString(),
        genreTags,
      })
      .where(eq(catalogItems.id, existing.id));
  } else {
    // Insert new product
    await db.insert(catalogItems).values({
      id: nanoid(),
      name: item.name,
      brand: item.brand,
      price: item.price,
      currency: item.currency,
      imageUrls: item.imageUrls,
      category: item.category,
      color: item.color,
      pattern: null,
      genreTags,
      season,
      affiliateUrl: item.affiliateUrl,
      inStock: true,
      source: "shopstyle",
      externalId: item.externalId,
    });
  }
}

// Sync products for a specific genre — fetches from ShopStyle and caches locally
// Returns count of items synced
export async function syncGenre(genreSlug: string): Promise<number> {
  if (!shopStyleAdapter.isConfigured()) {
    console.log(`[Sync] ShopStyle API not configured — using local catalog for ${genreSlug}`);
    return 0;
  }

  console.log(`[Sync] Starting sync for genre: ${genreSlug}`);

  // Fetch up to 200 items per genre (across multiple categories)
  const items = await shopStyleAdapter.fetchByGenre(genreSlug, 200);

  if (items.length === 0) {
    console.log(`[Sync] No items returned for ${genreSlug}`);
    return 0;
  }

  // Upsert all items — batched for performance
  let synced = 0;
  const batchSize = 20;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item) => upsertCatalogItem(item, genreSlug)));
    synced += batch.length;
  }

  console.log(`[Sync] Synced ${synced} items for genre: ${genreSlug}`);
  return synced;
}

// Full sync — runs all 12 genres (for nightly cron)
// Stagger requests to avoid rate limiting
export async function syncAllGenres(): Promise<Record<string, number>> {
  const genres = [
    "old-money", "y2k", "streetwear", "minimalist",
    "cottagecore", "dark-academia", "coastal-grandma", "grunge",
    "coquette", "gorpcore", "clean-girl", "indie-boho",
  ];

  const results: Record<string, number> = {};

  // Sequential to respect rate limits (ShopStyle is generous but let's be safe)
  for (const genre of genres) {
    results[genre] = await syncGenre(genre);
    // 500ms pause between genres to be respectful
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Mark stale items as out of stock (not synced in last 48 hours)
  const staleThreshold = new Date(Date.now() - 2 * CACHE_TTL_MS).toISOString();
  await db
    .update(catalogItems)
    .set({ inStock: false })
    .where(
      and(
        eq(catalogItems.source, "shopstyle"),
        eq(catalogItems.inStock, true),
        lt(catalogItems.lastSynced, staleThreshold)
      )
    );

  const totalSynced = Object.values(results).reduce((a, b) => a + b, 0);
  console.log(`[Sync] Full sync complete: ${totalSynced} items across ${genres.length} genres`);

  return results;
}

// Check if a genre needs a refresh (cache older than TTL)
export async function isGenreStale(genreSlug: string): Promise<boolean> {
  const freshThreshold = new Date(Date.now() - CACHE_TTL_MS).toISOString();

  // Check the most recently synced item for this genre
  const latestItem = await db.query.catalogItems.findFirst({
    where: and(
      eq(catalogItems.source, "shopstyle"),
      eq(catalogItems.inStock, true)
    ),
    orderBy: (items, { desc }) => desc(items.lastSynced),
  });

  // If no items or oldest sync is past threshold, it's stale
  if (!latestItem || !latestItem.lastSynced) return true;
  return latestItem.lastSynced < freshThreshold;
}
