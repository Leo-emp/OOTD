// GET /api/challenges — list all active challenges + user's progress
// POST /api/challenges — join a challenge or log a day

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { challenges, challengeProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

// Join a challenge
const JoinChallengeSchema = z.object({
  action: z.literal("join"),
  challengeId: z.string().max(50),
});

// Log a day's completion
const LogDaySchema = z.object({
  action: z.literal("log"),
  challengeId: z.string().max(50),
});

const ChallengeActionSchema = z.discriminatedUnion("action", [
  JoinChallengeSchema,
  LogDaySchema,
]);

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active challenges
    const allChallenges = await db.query.challenges.findMany({
      where: eq(challenges.isActive, true),
      orderBy: challenges.sortOrder,
    });

    // Get user's progress on all challenges
    const userProgress = await db.query.challengeProgress.findMany({
      where: eq(challengeProgress.userId, session.user.id),
    });

    // Map progress by challengeId for easy lookup
    const progressMap = new Map(
      userProgress.map((p) => [p.challengeId, p])
    );

    // Build response with challenge + progress combined
    const result = allChallenges.map((c) => {
      const progress = progressMap.get(c.id);
      const completedDays = (progress?.completedDays as string[]) || [];
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        genreSlug: c.genreSlug,
        durationDays: c.durationDays,
        difficulty: c.difficulty,
        badgeEmoji: c.badgeEmoji,
        dailyTips: c.dailyTips,
        // User's progress on this challenge
        joined: !!progress,
        status: progress?.status || null,
        completedDays,
        daysRemaining: progress
          ? Math.max(0, c.durationDays - completedDays.length)
          : c.durationDays,
        startDate: progress?.startDate || null,
      };
    });

    // Count badges earned (completed challenges)
    const badgesEarned = userProgress.filter((p) => p.status === "completed").length;

    return NextResponse.json({
      challenges: result,
      badgesEarned,
    });
  } catch (err) {
    console.error("[API] GET /api/challenges failed:", err);
    return NextResponse.json({ error: "Failed to load challenges" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof ChallengeActionSchema>;
    try {
      body = ChallengeActionSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    if (body.action === "join") {
      // Verify challenge exists
      const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, body.challengeId),
      });
      if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
      }

      // Check if already joined (and not completed/abandoned)
      const existing = await db.query.challengeProgress.findFirst({
        where: and(
          eq(challengeProgress.userId, session.user.id),
          eq(challengeProgress.challengeId, body.challengeId),
          eq(challengeProgress.status, "active"),
        ),
      });
      if (existing) {
        return NextResponse.json({ error: "Already enrolled in this challenge" }, { status: 409 });
      }

      // Create progress entry
      await db.insert(challengeProgress).values({
        id: nanoid(),
        userId: session.user.id,
        challengeId: body.challengeId,
        startDate: today,
        completedDays: [],
        status: "active",
      });

      return NextResponse.json({ joined: true, startDate: today });
    }

    if (body.action === "log") {
      // Find active progress for this challenge
      const progress = await db.query.challengeProgress.findFirst({
        where: and(
          eq(challengeProgress.userId, session.user.id),
          eq(challengeProgress.challengeId, body.challengeId),
          eq(challengeProgress.status, "active"),
        ),
      });
      if (!progress) {
        return NextResponse.json({ error: "Not enrolled in this challenge" }, { status: 404 });
      }

      const completedDays = (progress.completedDays as string[]) || [];

      // Check if already logged today for this challenge
      if (completedDays.includes(today)) {
        return NextResponse.json({ error: "Already logged today for this challenge" }, { status: 409 });
      }

      // Get challenge to check completion
      const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, body.challengeId),
      });
      if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
      }

      // Add today to completed days
      const updatedDays = [...completedDays, today];
      const isComplete = updatedDays.length >= challenge.durationDays;

      await db
        .update(challengeProgress)
        .set({
          completedDays: updatedDays,
          status: isComplete ? "completed" : "active",
          completedAt: isComplete ? new Date().toISOString() : null,
        })
        .where(eq(challengeProgress.id, progress.id));

      return NextResponse.json({
        logged: true,
        completedDays: updatedDays,
        isComplete,
        badgeEmoji: isComplete ? challenge.badgeEmoji : null,
        daysRemaining: Math.max(0, challenge.durationDays - updatedDays.length),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[API] POST /api/challenges failed:", err);
    return NextResponse.json({ error: "Failed to process challenge action" }, { status: 500 });
  }
}
