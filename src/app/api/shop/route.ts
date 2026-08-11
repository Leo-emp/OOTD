// GET /api/shop — personalized shopping recommendations based on wardrobe gaps
// POST /api/shop — generate new AI recommendations

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { shoppingRecommendations, wardrobeItems, catalogItems, styleProfiles, tasteProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { checkRateLimit, visionRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "@/lib/env";
import { GEMINI_MODEL } from "@/lib/constants";
import { z } from "zod";

// Zod schema for AI response
const ShopRecommendationSchema = z.array(z.object({
  catalogItemId: z.string(),
  reason: z.string(),
  matchScore: z.number().min(0).max(100),
  category: z.string(),
  pairsWithCategories: z.array(z.string()),
}));

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active recommendations
    const recs = await db.query.shoppingRecommendations.findMany({
      where: and(
        eq(shoppingRecommendations.userId, session.user.id),
        eq(shoppingRecommendations.status, "active"),
      ),
    });

    // Enrich with catalog item details
    const enriched = [];
    for (const rec of recs) {
      const item = await db.query.catalogItems.findFirst({
        where: eq(catalogItems.id, rec.catalogItemId),
      });
      if (item && item.inStock) {
        enriched.push({
          id: rec.id,
          reason: rec.reason,
          matchScore: rec.matchScore,
          category: rec.category,
          genreSlug: rec.genreSlug,
          item: {
            id: item.id,
            name: item.name,
            brand: item.brand,
            price: item.price,
            imageUrl: (item.imageUrls as string[])?.[0] || "",
            affiliateUrl: item.affiliateUrl,
            color: item.color,
          },
        });
      }
    }

    // Sort by match score
    enriched.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ recommendations: enriched });
  } catch (err) {
    console.error("[API] GET /api/shop failed:", err);
    return NextResponse.json({ error: "Failed to load recommendations" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — AI call
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(visionRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Daily AI limit reached" }, { status: 429 });
    }

    // Get user's wardrobe
    const wardrobe = await db.query.wardrobeItems.findMany({
      where: and(eq(wardrobeItems.userId, session.user.id), eq(wardrobeItems.status, "ready")),
    });

    // Get user's style profile for genre context
    const profile = await db.query.styleProfiles.findFirst({
      where: eq(styleProfiles.userId, session.user.id),
    });

    // Get taste profile for personalization
    const taste = await db.query.tasteProfiles.findFirst({
      where: eq(tasteProfiles.userId, session.user.id),
    });

    const primaryGenre = profile?.primaryGenre || "old-money";

    // Get catalog items in user's genre that they don't own
    const catalog = await db.query.catalogItems.findMany({
      where: eq(catalogItems.inStock, true),
      limit: 100,
    });

    // Filter to genre-relevant items
    const genreItems = catalog.filter((c) => {
      const tags = (c.genreTags as string[]) || [];
      return tags.includes(primaryGenre);
    });

    if (genreItems.length === 0 || wardrobe.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: wardrobe.length === 0
          ? "Upload wardrobe items first for personalized recommendations."
          : "No matching catalog items found.",
      });
    }

    // Build wardrobe summary
    const wardrobeSummary = wardrobe.map((w) => ({
      id: w.id,
      category: w.category,
      color: w.color,
      genreTags: w.genreTags,
    }));

    // Build catalog summary
    const catalogSummary = genreItems.slice(0, 50).map((c) => ({
      id: c.id,
      name: c.name,
      brand: c.brand,
      price: c.price,
      category: c.category,
      color: c.color,
    }));

    // Taste context
    const tasteContext = taste ? `
User's taste profile (from ${taste.totalInteractions} interactions):
- Top genres: ${JSON.stringify(taste.genreWeights)}
- Color preferences: ${JSON.stringify(taste.colorAffinities)}
- Price range: $${taste.priceMin}-$${taste.priceMax} (avg $${taste.priceMean})
- Style: ${(taste.formalityCasual ?? 0.5) > 0.5 ? "casual-leaning" : "formal-leaning"}, ${(taste.boldnessMinimal ?? 0.5) > 0.5 ? "minimal" : "bold"}, ${(taste.trendClassic ?? 0.5) > 0.5 ? "classic" : "trendy"}` : "";

    // Ask Gemini for recommendations
    const genai = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
    const model = genai.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a personal shopping assistant. The user's wardrobe and available catalog items are below.

Analyze what's MISSING from their wardrobe to build complete outfits in the "${primaryGenre.replace(/-/g, " ")}" aesthetic. Recommend 5-8 catalog items that would complement their existing clothes.
${tasteContext}

User's wardrobe (${wardrobe.length} items):
${JSON.stringify(wardrobeSummary)}

Available catalog items:
${JSON.stringify(catalogSummary)}

Return JSON array:
[
  {
    "catalogItemId": "item_id_from_catalog",
    "reason": "Pairs with your navy blazer and cream chinos for a complete Old Money casual look",
    "matchScore": 92,
    "category": "shoes",
    "pairsWithCategories": ["top", "bottom"]
  }
]

Rules:
- Only recommend items from the catalog list (use exact IDs)
- Higher matchScore = more essential to complete outfits
- Reason should reference specific wardrobe items the user owns
- Focus on gaps — don't recommend categories they're well-stocked in
- Consider color coordination and genre rules`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    const validated = ShopRecommendationSchema.parse(parsed);

    // Clear old recommendations and save new ones
    await db
      .delete(shoppingRecommendations)
      .where(eq(shoppingRecommendations.userId, session.user.id));

    for (const rec of validated) {
      // Verify the catalog item ID exists
      const exists = genreItems.find((c) => c.id === rec.catalogItemId);
      if (!exists) continue;

      await db.insert(shoppingRecommendations).values({
        id: nanoid(),
        userId: session.user.id,
        catalogItemId: rec.catalogItemId,
        reason: rec.reason,
        matchScore: rec.matchScore,
        category: rec.category,
        wardrobeItemIds: [],
        genreSlug: primaryGenre,
      });
    }

    return NextResponse.json({
      generated: true,
      count: validated.length,
    });
  } catch (err) {
    console.error("[API] POST /api/shop failed:", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
