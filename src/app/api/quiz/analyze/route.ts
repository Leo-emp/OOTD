// POST /api/quiz/analyze — AI-powered quiz analysis
// Takes quiz answers, generates Style DNA breakdown via Gemini
// Returns: primary/secondary/accent genres, style profile summary

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleProfiles } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit, quizRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";

// Validate quiz submission
const QuizSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — prevent quiz spam
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(quizRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Quiz limit reached. Try again tomorrow." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = QuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quiz data" }, { status: 400 });
    }

    const { answers } = parsed.data;

    // Calculate genre distribution from answers
    const genreCounts: Record<string, number> = {};
    Object.values(answers).forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    // Sort by frequency — top 3 become primary/secondary/accent
    const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    const primaryGenre = sorted[0]?.[0] || "minimalist";
    const secondaryGenre = sorted[1]?.[0] || undefined;
    const accentGenre = sorted[2]?.[0] || undefined;

    // Upsert style profile
    const existing = await db.query.styleProfiles.findFirst({
      where: eq(styleProfiles.userId, session.user.id),
    });

    if (existing) {
      await db
        .update(styleProfiles)
        .set({
          primaryGenre,
          secondaryGenre: secondaryGenre || null,
          accentGenre: accentGenre || null,
          activeGenre: primaryGenre,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(styleProfiles.id, existing.id));
    } else {
      await db.insert(styleProfiles).values({
        id: nanoid(),
        userId: session.user.id,
        primaryGenre,
        secondaryGenre: secondaryGenre || null,
        accentGenre: accentGenre || null,
        activeGenre: primaryGenre,
      });
    }

    // Build Style DNA response
    const totalAnswers = Object.values(answers).length;
    const breakdown = sorted.map(([genre, count]) => ({
      genre,
      percentage: Math.round((count / totalAnswers) * 100),
    }));

    return NextResponse.json({
      styleDna: {
        primaryGenre,
        secondaryGenre,
        accentGenre,
        breakdown,
      },
    });
  } catch (err) {
    console.error("[API] POST /api/quiz/analyze failed:", err);
    return NextResponse.json({ error: "Quiz analysis failed" }, { status: 500 });
  }
}
