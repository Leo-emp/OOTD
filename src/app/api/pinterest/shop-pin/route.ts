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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await db.query.pinterestConnections.findFirst({
    where: eq(pinterestConnections.userId, session.user.id),
  });

  if (!connection) {
    return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
  }

  const body = await request.json();
  const { url } = body as { url: string };

  if (!url) {
    return NextResponse.json({ error: "Provide a Pinterest pin URL" }, { status: 400 });
  }

  const parsed = parsePinterestUrl(url);
  if (!parsed || parsed.type !== "pin") {
    return NextResponse.json({ error: "Invalid pin URL" }, { status: 400 });
  }

  try {
    // Step 1: Fetch the pin data
    const pin = await fetchPin(connection.accessToken, parsed.id);

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
