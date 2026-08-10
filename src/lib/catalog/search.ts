import { db } from "@/lib/db";
import { catalogItems } from "@/lib/db/schema";
import { and, eq, gte, lte, like } from "drizzle-orm";

// Search catalog by genre tags + filters
// Vector search (sqlite-vec) added in scaling phase
export async function searchCatalog(params: {
  genreSlug: string;
  category?: string;
  season?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}) {
  const { genreSlug, category, season, minPrice, maxPrice, limit = 50 } = params;

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

  const items = await db.query.catalogItems.findMany({
    where: and(...conditions),
    limit,
  });

  return items;
}
