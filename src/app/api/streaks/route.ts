// GET /api/streaks — get current streak stats
// POST /api/streaks — log today's outfit (one entry per day max)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleStreaks } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

// Validation for logging an outfit
const LogStreakSchema = z.object({
  genreSlug: z.string().regex(/^[a-z0-9-]{1,30}$/),
  outfitId: z.string().max(50).optional(),
  note: z.string().max(200).optional(),
});

// Calculate current streak from a sorted list of dates (newest first)
function calculateStreak(dates: string[]): { current: number; longest: number; thisWeek: number } {
  if (dates.length === 0) return { current: 0, longest: 0, thisWeek: 0 };

  // Get today and this week's Monday
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const mondayStr = monday.toISOString().split("T")[0];

  // Count this week's logs
  const thisWeek = dates.filter((d) => d >= mondayStr).length;

  // Calculate current streak — must include today or yesterday to be active
  let current = 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dates[0] !== today && dates[0] !== yesterdayStr) {
    // Streak is broken — last log was more than 1 day ago
    current = 0;
  } else {
    // Count consecutive days backward from the most recent entry
    let expected = new Date(dates[0]);
    for (const date of dates) {
      const expectedStr = expected.toISOString().split("T")[0];
      if (date === expectedStr) {
        current++;
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak ever
  let longest = 0;
  let streakCount = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

    if (Math.abs(diffDays - 1) < 0.01) {
      streakCount++;
    } else {
      longest = Math.max(longest, streakCount);
      streakCount = 1;
    }
  }
  longest = Math.max(longest, streakCount, current);

  return { current, longest, thisWeek };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all streak entries sorted by date (newest first)
    const entries = await db.query.styleStreaks.findMany({
      where: eq(styleStreaks.userId, session.user.id),
      orderBy: desc(styleStreaks.date),
    });

    const dates = entries.map((e) => e.date);
    const stats = calculateStreak(dates);

    // Check if user already logged today
    const today = new Date().toISOString().split("T")[0];
    const loggedToday = entries.length > 0 && entries[0].date === today;

    // Recent entries for calendar display (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDates = dates.filter((d) => d >= thirtyDaysAgo.toISOString().split("T")[0]);

    return NextResponse.json({
      currentStreak: stats.current,
      longestStreak: stats.longest,
      thisWeek: stats.thisWeek,
      totalDays: dates.length,
      loggedToday,
      recentDates,
    });
  } catch (err) {
    console.error("[API] GET /api/streaks failed:", err);
    return NextResponse.json({ error: "Failed to load streak data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof LogStreakSchema>;
    try {
      body = LogStreakSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid streak data" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already logged today — one entry per day
    const existing = await db.query.styleStreaks.findFirst({
      where: and(
        eq(styleStreaks.userId, session.user.id),
        eq(styleStreaks.date, today),
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Already logged today" }, { status: 409 });
    }

    // Insert today's entry
    await db.insert(styleStreaks).values({
      id: nanoid(),
      userId: session.user.id,
      date: today,
      outfitId: body.outfitId,
      genreSlug: body.genreSlug,
      note: body.note,
    });

    // Recalculate stats after logging
    const entries = await db.query.styleStreaks.findMany({
      where: eq(styleStreaks.userId, session.user.id),
      orderBy: desc(styleStreaks.date),
    });
    const dates = entries.map((e) => e.date);
    const stats = calculateStreak(dates);

    return NextResponse.json({
      logged: true,
      currentStreak: stats.current,
      longestStreak: stats.longest,
      thisWeek: stats.thisWeek,
      totalDays: dates.length,
    });
  } catch (err) {
    console.error("[API] POST /api/streaks failed:", err);
    return NextResponse.json({ error: "Failed to log streak" }, { status: 500 });
  }
}
