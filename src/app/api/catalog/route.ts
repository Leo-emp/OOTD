// GET /api/catalog — browse catalog with filters
// Public endpoint — no auth required for browsing
// Supports: genre, category, brand, price range, pagination

import { NextRequest, NextResponse } from "next/server";
import { smartSearch, getGenreBrands, getGenrePriceRange } from "@/lib/catalog/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const genre = searchParams.get("genre") || "minimalist";
  const category = searchParams.get("category") || undefined;
  const brand = searchParams.get("brand") || undefined;
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  // Fetch matching products via hybrid search (API → cache → local)
  const items = await smartSearch({
    genreSlug: genre,
    category,
    brand,
    minPrice,
    maxPrice,
    limit,
  });

  // Also return available filters for the UI
  const [brands, priceRange] = await Promise.all([
    getGenreBrands(genre),
    getGenrePriceRange(genre),
  ]);

  return NextResponse.json({
    items,
    filters: {
      brands,
      priceRange,
      categories: ["top", "bottom", "shoes", "accessory", "outerwear", "bag"],
    },
    total: items.length,
  });
}
