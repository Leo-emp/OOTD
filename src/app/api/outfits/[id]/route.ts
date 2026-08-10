// GET /api/outfits/:id — fetch a single outfit with full item data
// Fallback for when sessionStorage is empty (shared links, page refresh)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { outfits, outfitItems, catalogItems, wardrobeItems, genreRulesets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the outfit row
  const outfit = await db.query.outfits.findFirst({
    where: eq(outfits.id, id),
  });

  if (!outfit || outfit.userId !== session.user.id) {
    return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  }

  // Fetch all items in this outfit
  const items = await db.query.outfitItems.findMany({
    where: eq(outfitItems.outfitId, id),
  });

  // Enrich each item with full data from catalog or wardrobe
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      if (item.itemType === "wardrobe") {
        const w = await db.query.wardrobeItems.findFirst({
          where: eq(wardrobeItems.id, item.itemId),
        });
        return {
          itemId: item.itemId,
          itemType: "wardrobe" as const,
          position: item.position,
          name: `My ${w?.category || "item"}`,
          brand: "My Wardrobe",
          price: 0,
          imageUrl: w?.imageThumbUrl || w?.imageUrl || "",
          affiliateUrl: "",
          color: w?.color || "",
        };
      }

      const c = await db.query.catalogItems.findFirst({
        where: eq(catalogItems.id, item.itemId),
      });
      return {
        itemId: item.itemId,
        itemType: "catalog" as const,
        position: item.position,
        name: c?.name || "Item",
        brand: c?.brand || "",
        price: c?.price || 0,
        imageUrl: (c?.imageUrls as string[])?.[0] || "",
        affiliateUrl: c?.affiliateUrl || "",
        color: c?.color || "",
      };
    })
  );

  // Look up genre slug from genre ID
  const genre = await db.query.genreRulesets.findFirst({
    where: eq(genreRulesets.id, outfit.genreId),
  });

  const totalPrice = enrichedItems
    .filter((i) => i.itemType === "catalog")
    .reduce((sum, i) => sum + i.price, 0);

  return NextResponse.json({
    outfit: {
      id: outfit.id,
      genreSlug: genre?.slug || "unknown",
      occasion: outfit.occasion || "casual",
      weather: outfit.weather,
      items: enrichedItems,
      styleExplanation: outfit.styleExplanation || "",
      totalPrice,
      source: outfit.source,
    },
  });
}
