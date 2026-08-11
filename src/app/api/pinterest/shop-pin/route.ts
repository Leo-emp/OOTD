// POST /api/pinterest/shop-pin — find affordable alternatives for a Pinterest pin
// Analyzes pin aesthetic → maps to genre → searches catalog for similar items

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { pinterestConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchPin, parsePinterestUrl } from "@/lib/pinterest/client";
import { analyzePinImage } from "@/lib/pinterest/vibe-match";
import { smartSearch } from "@/lib/catalog/search";
import { checkRateLimit, visionRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { z } from "zod";

// Validate request body — must provide a Pinterest pin URL
const ShopPinSchema = z.object({
  url: z.string().url().max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — Gemini Vision + catalog search
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(visionRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Daily shop limit reached. Upgrade to Pro for more." }, { status: 429 });
    }

    const connection = await db.query.pinterestConnections.findFirst({
      where: eq(pinterestConnections.userId, session.user.id),
    });

    if (!connection) {
      return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const parsed = ShopPinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Provide a valid Pinterest pin URL" }, { status: 400 });
    }

    const urlParsed = parsePinterestUrl(parsed.data.url);
    if (!urlParsed || urlParsed.type !== "pin") {
      return NextResponse.json({ error: "Invalid pin URL" }, { status: 400 });
    }

    // Step 1: Fetch the pin data
    const pin = await fetchPin(connection.accessToken, urlParsed.id);

    // Step 2: Analyze the pin's aesthetic with Gemini Vision
    const vibeResult = await analyzePinImage(pin.imageUrl);

    // Step 3: Search our catalog for items matching the top genre
    const topGenre = vibeResult.genres[0];
    const catalogItems = await smartSearch({
      genreSlug: topGenre.slug,
      limit: 12,
    });

    // Map catalog results to response format
    const similarItems = catalogItems.map((c) => ({
      id: c.id,
      name: c.name,
      brand: c.brand,
      price: c.price,
      imageUrl: (c.imageUrls as string[])?.[0] || "",
      affiliateUrl: c.affiliateUrl,
      category: c.category,
    }));

    return NextResponse.json({
      pin: {
        title: pin.title,
        imageUrl: pin.imageUrl,
      },
      vibeMatch: vibeResult,
      similarItems,
    });
  } catch (err) {
    console.error("[Pinterest] Shop pin failed:", err);
    return NextResponse.json({ error: "Failed to find similar items" }, { status: 500 });
  }
}
