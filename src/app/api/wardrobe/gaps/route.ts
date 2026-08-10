// GET /api/wardrobe/gaps?genre=old-money — identifies missing wardrobe categories for a genre
// Returns what the user has and what they're missing, with shopping suggestions

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wardrobeItems, genreRulesets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Essential categories for a complete outfit
const ESSENTIAL_CATEGORIES = ["top", "bottom", "shoes"];
const OPTIONAL_CATEGORIES = ["outerwear", "accessory", "bag"];

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const genreSlug = request.nextUrl.searchParams.get("genre");
  if (!genreSlug) {
    return NextResponse.json({ error: "Genre required" }, { status: 400 });
  }

  // Get genre for reference brands + description
  const genre = await db.query.genreRulesets.findFirst({
    where: eq(genreRulesets.slug, genreSlug),
  });

  // Get user's wardrobe items that match this genre
  const userItems = await db.query.wardrobeItems.findMany({
    where: and(
      eq(wardrobeItems.userId, session.user.id),
      eq(wardrobeItems.status, "ready"),
    ),
  });

  // Filter to genre-compatible items
  const genreItems = userItems.filter((w) => {
    const tags = (w.genreTags as string[]) || [];
    return tags.includes(genreSlug);
  });

  // Count items per category
  const categoryCounts: Record<string, number> = {};
  for (const item of genreItems) {
    const cat = item.category || "unknown";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  // Identify gaps
  const gaps: { category: string; priority: "essential" | "optional"; suggestion: string }[] = [];

  for (const cat of ESSENTIAL_CATEGORIES) {
    if (!categoryCounts[cat]) {
      gaps.push({
        category: cat,
        priority: "essential",
        suggestion: getSuggestion(cat, genreSlug, genre?.referenceBrands || []),
      });
    }
  }

  for (const cat of OPTIONAL_CATEGORIES) {
    if (!categoryCounts[cat]) {
      gaps.push({
        category: cat,
        priority: "optional",
        suggestion: getSuggestion(cat, genreSlug, genre?.referenceBrands || []),
      });
    }
  }

  // Calculate completeness score
  const essentialCount = ESSENTIAL_CATEGORIES.filter((c) => categoryCounts[c]).length;
  const optionalCount = OPTIONAL_CATEGORIES.filter((c) => categoryCounts[c]).length;
  const completeness = Math.round(
    ((essentialCount / ESSENTIAL_CATEGORIES.length) * 70 +
      (optionalCount / OPTIONAL_CATEGORIES.length) * 30)
  );

  return NextResponse.json({
    genre: genreSlug,
    totalItems: genreItems.length,
    categoryCounts,
    gaps,
    completeness,
    isOutfitReady: essentialCount === ESSENTIAL_CATEGORIES.length,
  });
}

// Genre-aware shopping suggestions
function getSuggestion(category: string, genre: string, brands: string[]): string {
  const brandHint = brands.length > 0 ? ` Try ${brands.slice(0, 2).join(" or ")}.` : "";

  const suggestions: Record<string, Record<string, string>> = {
    top: {
      "old-money": `A tailored blazer or cashmere knit in navy or cream.${brandHint}`,
      "streetwear": `A graphic tee or oversized hoodie.${brandHint}`,
      "minimalist": `A clean-cut tee or structured button-down in neutrals.${brandHint}`,
      "default": `A versatile top that fits your ${genre.replace("-", " ")} style.${brandHint}`,
    },
    bottom: {
      "old-money": `Tailored trousers or chinos in beige or navy.${brandHint}`,
      "streetwear": `Cargo pants or wide-leg jeans.${brandHint}`,
      "minimalist": `Clean straight-leg trousers in black or grey.${brandHint}`,
      "default": `Bottoms that match your ${genre.replace("-", " ")} aesthetic.${brandHint}`,
    },
    shoes: {
      "old-money": `Leather loafers or clean white sneakers.${brandHint}`,
      "streetwear": `Statement sneakers — Air Force 1s, Dunks, or New Balance.${brandHint}`,
      "minimalist": `White leather sneakers or simple Chelsea boots.${brandHint}`,
      "default": `Shoes that complete your ${genre.replace("-", " ")} look.${brandHint}`,
    },
    outerwear: {
      "default": `A jacket or coat that complements your ${genre.replace("-", " ")} pieces.${brandHint}`,
    },
    accessory: {
      "default": `An accessory to elevate your outfits — watch, bag, or jewelry.${brandHint}`,
    },
    bag: {
      "default": `A bag that matches your ${genre.replace("-", " ")} aesthetic.${brandHint}`,
    },
  };

  return suggestions[category]?.[genre] || suggestions[category]?.["default"] || `Add a ${category} to complete your wardrobe.`;
}
