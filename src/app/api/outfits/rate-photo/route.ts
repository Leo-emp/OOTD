// POST /api/outfits/rate-photo — AI rates a user's outfit photo against a genre
// Accepts multipart form: image file + genre slug
// Returns score (1-10), feedback, improvements, and genre alignment

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { genreRulesets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { geminiProvider } from "@/lib/ai/gemini";
import { checkRateLimit, visionRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";

export async function POST(request: NextRequest) {
  try {
    // Auth check — must be logged in
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — Gemini Vision is expensive
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(visionRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Daily rating limit reached. Upgrade to Pro for 30/day." }, { status: 429 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const genreSlug = formData.get("genre") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!genreSlug) {
      return NextResponse.json({ error: "No genre selected" }, { status: 400 });
    }

    // Validate genre slug format — prevent injection via form field
    if (!/^[a-z0-9-]{1,30}$/.test(genreSlug)) {
      return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
    }

    // Look up genre ruleset from DB
    const genre = await db.query.genreRulesets.findFirst({
      where: eq(genreRulesets.slug, genreSlug),
    });

    if (!genre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    // Convert file to base64 for Gemini vision
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Call Gemini vision to rate the outfit
    const rating = await geminiProvider.rateOutfit({
      imageBase64: base64,
      genre: {
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
        colorRules: genre.colorRules as { palette: string[]; maxColorsPerOutfit: number; forbiddenColors: string[] },
        fitRules: genre.fitRules as { silhouette: string; forbiddenFits: string[]; logoVisibility: string },
        mustHave: genre.mustHave as string[],
        forbidden: genre.forbidden as string[],
        occasionModifiers: genre.occasionModifiers as Record<string, string>,
        priceRange: genre.priceRange as { min: number; max: number },
        referenceBrands: genre.referenceBrands as string[],
      },
    });

    return NextResponse.json(rating);
  } catch (err) {
    console.error("[API] POST /api/outfits/rate-photo failed:", err);
    return NextResponse.json({ error: "Rating failed" }, { status: 500 });
  }
}
