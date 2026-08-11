// GET /api/shop/complete-outfit?itemId=xxx — find catalog items that complete outfits
// with a specific wardrobe item

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wardrobeItems, catalogItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Category complements — what goes with what
const COMPLEMENTS: Record<string, string[]> = {
  top: ["bottom", "shoes", "accessory", "outerwear"],
  bottom: ["top", "shoes", "accessory", "outerwear"],
  shoes: ["top", "bottom", "accessory"],
  outerwear: ["top", "bottom", "shoes"],
  accessory: ["top", "bottom", "shoes"],
  bag: ["top", "bottom", "shoes"],
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemId = new URL(request.url).searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    // Get the wardrobe item
    const item = await db.query.wardrobeItems.findFirst({
      where: and(eq(wardrobeItems.id, itemId), eq(wardrobeItems.userId, session.user.id)),
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Find complementary categories
    const category = item.category || "top";
    const needCategories = COMPLEMENTS[category] || ["top", "bottom", "shoes"];

    // Get genre-matching catalog items in complementary categories
    const genreTags = (item.genreTags as string[]) || [];
    const allCatalog = await db.query.catalogItems.findMany({
      where: eq(catalogItems.inStock, true),
      limit: 200,
    });

    // Filter and score
    const scored = allCatalog
      .filter((c) => {
        // Must be a complementary category
        if (!needCategories.includes(c.category)) return false;
        // Prefer genre-matching items
        const cTags = (c.genreTags as string[]) || [];
        return genreTags.length === 0 || cTags.some((t) => genreTags.includes(t));
      })
      .map((c) => {
        // Score: genre match strength + color compatibility
        const cTags = (c.genreTags as string[]) || [];
        const genreOverlap = cTags.filter((t) => genreTags.includes(t)).length;
        const score = genreOverlap * 30 + (c.category === needCategories[0] ? 20 : 10);
        return {
          id: c.id,
          name: c.name,
          brand: c.brand,
          price: c.price,
          category: c.category,
          color: c.color,
          imageUrl: (c.imageUrls as string[])?.[0] || "",
          affiliateUrl: c.affiliateUrl,
          matchScore: Math.min(score, 100),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12);

    return NextResponse.json({
      forItem: {
        id: item.id,
        category: item.category,
        color: item.color,
        genreTags: item.genreTags,
      },
      completions: scored,
    });
  } catch (err) {
    console.error("[API] GET /api/shop/complete-outfit failed:", err);
    return NextResponse.json({ error: "Failed to find completions" }, { status: 500 });
  }
}
