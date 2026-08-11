// GET /api/outfits/saved — fetch user's loved outfits (saved collection)
// GET /api/outfits/saved?all=true — fetch full outfit history (all ratings)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { outfitRatings, outfits, outfitItems, catalogItems, wardrobeItems } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "true";

  // Get ratings — either just loves or all
  const ratings = await db.query.outfitRatings.findMany({
    where: showAll
      ? eq(outfitRatings.userId, session.user.id)
      : and(eq(outfitRatings.userId, session.user.id), eq(outfitRatings.rating, "love")),
    orderBy: desc(outfitRatings.createdAt),
    limit: 50,
  });

  if (ratings.length === 0) {
    return NextResponse.json({ outfits: [] });
  }

  // Get the corresponding outfit rows
  const outfitIds = ratings.map((r) => r.outfitId);
  const outfitRows = await db.query.outfits.findMany({
    where: inArray(outfits.id, outfitIds),
  });
  const outfitMap = new Map(outfitRows.map((o) => [o.id, o]));

  // Get all items for these outfits
  const items = await db.query.outfitItems.findMany({
    where: inArray(outfitItems.outfitId, outfitIds),
  });

  // Get catalog + wardrobe data for item enrichment
  const catalogIds = items.filter((i) => i.itemType === "catalog").map((i) => i.itemId);
  const wardrobeIds = items.filter((i) => i.itemType === "wardrobe").map((i) => i.itemId);

  const [catalogRows, wardrobeRows] = await Promise.all([
    catalogIds.length > 0 ? db.query.catalogItems.findMany({ where: inArray(catalogItems.id, catalogIds) }) : [],
    wardrobeIds.length > 0 ? db.query.wardrobeItems.findMany({ where: inArray(wardrobeItems.id, wardrobeIds) }) : [],
  ]);

  const catalogMap = new Map(catalogRows.map((c) => [c.id, c]));
  const wardrobeMap = new Map(wardrobeRows.map((w) => [w.id, w]));

  // Build enriched outfit objects
  const enrichedOutfits = ratings.map((rating) => {
    const outfit = outfitMap.get(rating.outfitId);
    if (!outfit) return null;

    // Get items for this outfit
    const outfitItemRows = items.filter((i) => i.outfitId === outfit.id);
    const enrichedItems = outfitItemRows.map((oi) => {
      if (oi.itemType === "catalog") {
        const c = catalogMap.get(oi.itemId);
        return c ? {
          itemId: c.id,
          itemType: "catalog" as const,
          position: oi.position,
          name: c.name,
          brand: c.brand,
          price: c.price,
          imageUrl: (c.imageUrls as string[])?.[0] || "",
          affiliateUrl: c.affiliateUrl,
          color: c.color,
        } : null;
      } else {
        const w = wardrobeMap.get(oi.itemId);
        return w ? {
          itemId: w.id,
          itemType: "wardrobe" as const,
          position: oi.position,
          name: `My ${w.category || "item"}`,
          brand: "My Wardrobe",
          price: 0,
          imageUrl: w.imageThumbUrl || w.imageUrl,
          affiliateUrl: "",
          color: w.color || "",
        } : null;
      }
    }).filter(Boolean);

    const totalPrice = enrichedItems
      .filter((i) => i && i.itemType === "catalog")
      .reduce((sum, item) => sum + ((item as { price: number }).price || 0), 0);

    return {
      id: outfit.id,
      genreSlug: outfit.genreId,
      occasion: outfit.occasion,
      weather: outfit.weather,
      items: enrichedItems,
      styleExplanation: outfit.styleExplanation || "",
      totalPrice,
      source: outfit.source,
      rating: rating.rating,
      ratedAt: rating.createdAt,
    };
  }).filter(Boolean);

    return NextResponse.json({ outfits: enrichedOutfits });
  } catch (err) {
    console.error("[API] GET /api/outfits/saved failed:", err);
    return NextResponse.json({ error: "Failed to fetch saved outfits" }, { status: 500 });
  }
}
