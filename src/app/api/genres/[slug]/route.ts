// GET /api/genres/:slug — returns full genre ruleset data for the explorer page
// Public endpoint, no auth required (genre info is not user-specific)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { genreRulesets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Look up genre by slug
  const genre = await db.query.genreRulesets.findFirst({
    where: eq(genreRulesets.slug, slug),
  });

  if (!genre) {
    return NextResponse.json({ error: "Genre not found" }, { status: 404 });
  }

  // Return the full genre data for the explorer page
  return NextResponse.json({
    genre: {
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      description: genre.description,
      colorRules: genre.colorRules,
      fitRules: genre.fitRules,
      mustHave: genre.mustHave,
      forbidden: genre.forbidden,
      occasionModifiers: genre.occasionModifiers,
      priceRange: genre.priceRange,
      referenceBrands: genre.referenceBrands,
      moodImageUrl: genre.moodImageUrl,
    },
  });
}
