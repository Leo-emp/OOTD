// GET /api/seasonal-refresh — get cached seasonal wardrobe audit
// POST /api/seasonal-refresh — trigger AI wardrobe gap analysis for current season

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { seasonalAudits, wardrobeItems, styleProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { checkRateLimit, visionRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "@/lib/env";
import { GEMINI_MODEL } from "@/lib/constants";

// Determine current fashion season
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  if (month >= 2 && month <= 4) return `spring-${year}`;
  if (month >= 5 && month <= 7) return `summer-${year}`;
  if (month >= 8 && month <= 10) return `fall-${year}`;
  return `winter-${year}`;
}

// Zod schema for AI response validation
const SeasonalAuditResponseSchema = z.object({
  missingItems: z.array(z.object({
    category: z.string(),
    suggestion: z.string(),
    priority: z.enum(["essential", "nice-to-have"]),
  })),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSeason = getCurrentSeason();

    // Get cached audit for current season
    const audit = await db.query.seasonalAudits.findFirst({
      where: and(
        eq(seasonalAudits.userId, session.user.id),
        eq(seasonalAudits.season, currentSeason),
      ),
    });

    return NextResponse.json({
      season: currentSeason,
      audit: audit ? {
        genreSlug: audit.genreSlug,
        missingItems: audit.missingItems,
        score: audit.score,
        summary: audit.summary,
        createdAt: audit.createdAt,
      } : null,
    });
  } catch (err) {
    console.error("[API] GET /api/seasonal-refresh failed:", err);
    return NextResponse.json({ error: "Failed to load seasonal audit" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — uses vision rate limit since this calls Gemini
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(visionRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Daily AI limit reached. Try again tomorrow." }, { status: 429 });
    }

    // Optional genre override — defaults to user's primary genre
    const GenreSchema = z.object({
      genreSlug: z.string().regex(/^[a-z0-9-]{1,30}$/).optional(),
    });
    let body: z.infer<typeof GenreSchema>;
    try {
      body = GenreSchema.parse(await request.json());
    } catch {
      body = {};
    }

    // Get user's primary genre if not specified
    const profile = await db.query.styleProfiles.findFirst({
      where: eq(styleProfiles.userId, session.user.id),
    });
    const genreSlug = body.genreSlug || profile?.primaryGenre || "old-money";

    // Get user's wardrobe
    const wardrobe = await db.query.wardrobeItems.findMany({
      where: and(
        eq(wardrobeItems.userId, session.user.id),
        eq(wardrobeItems.status, "ready"),
      ),
    });

    // Build wardrobe summary for AI
    const wardrobeSummary = wardrobe.map((w) => ({
      category: w.category,
      color: w.color,
      pattern: w.pattern,
      genreTags: w.genreTags,
      season: w.season,
    }));

    const currentSeason = getCurrentSeason();
    const seasonName = currentSeason.split("-")[0]; // "fall", "winter", etc.

    // Ask Gemini to audit the wardrobe for this season + genre
    const genai = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
    const model = genai.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a fashion stylist analyzing a user's wardrobe for the ${seasonName} season in the "${genreSlug.replace(/-/g, " ")}" aesthetic.

Current wardrobe (${wardrobe.length} items):
${JSON.stringify(wardrobeSummary, null, 2)}

Analyze what's missing for a complete ${seasonName} wardrobe in this genre. Score their readiness 0-100.

Return JSON:
{
  "missingItems": [
    { "category": "outerwear", "suggestion": "A camel wool coat for layering", "priority": "essential" },
    { "category": "accessory", "suggestion": "Leather gloves in cognac", "priority": "nice-to-have" }
  ],
  "score": 65,
  "summary": "Your Old Money fall wardrobe is 65% ready. You have great basics but need key outerwear and accessories."
}

Rules:
- List 3-6 missing items, prioritized
- Be specific about colors, materials, and styles that match the genre
- Score should reflect how well-equipped they are for the season
- If wardrobe is empty, score should be low and suggestions should be essentials`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    const validated = SeasonalAuditResponseSchema.parse(parsed);

    // Upsert the audit result
    const existingAudit = await db.query.seasonalAudits.findFirst({
      where: and(
        eq(seasonalAudits.userId, session.user.id),
        eq(seasonalAudits.season, currentSeason),
        eq(seasonalAudits.genreSlug, genreSlug),
      ),
    });

    if (existingAudit) {
      await db
        .update(seasonalAudits)
        .set({
          missingItems: validated.missingItems,
          score: validated.score,
          summary: validated.summary,
        })
        .where(eq(seasonalAudits.id, existingAudit.id));
    } else {
      await db.insert(seasonalAudits).values({
        id: nanoid(),
        userId: session.user.id,
        season: currentSeason,
        genreSlug,
        missingItems: validated.missingItems,
        score: validated.score,
        summary: validated.summary,
      });
    }

    return NextResponse.json({
      season: currentSeason,
      audit: {
        genreSlug,
        missingItems: validated.missingItems,
        score: validated.score,
        summary: validated.summary,
      },
    });
  } catch (err) {
    console.error("[API] POST /api/seasonal-refresh failed:", err);
    return NextResponse.json({ error: "Failed to analyze wardrobe" }, { status: 500 });
  }
}
