// POST /api/cron/notify — generate in-app notifications for all users
// Runs daily via Vercel Cron — creates streak reminders, challenge nudges, etc.
// Protected by CRON_SECRET

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, styleStreaks, challengeProgress, challenges, notifications } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let streakReminders = 0;
  let challengeNudges = 0;

  // Get all users
  const allUsers = await db.query.users.findMany({
    columns: { id: true, name: true },
  });

  for (const user of allUsers) {
    try {
      // ── Streak Reminders ──
      // If user logged yesterday but not today → "Don't break your streak!"
      const yesterdayStreak = await db.query.styleStreaks.findFirst({
        where: and(
          eq(styleStreaks.userId, user.id),
          eq(styleStreaks.date, yesterday),
        ),
      });
      const todayStreak = await db.query.styleStreaks.findFirst({
        where: and(
          eq(styleStreaks.userId, user.id),
          eq(styleStreaks.date, today),
        ),
      });

      if (yesterdayStreak && !todayStreak) {
        // Check if we already sent this notification today
        const alreadySent = await db.query.notifications.findFirst({
          where: and(
            eq(notifications.userId, user.id),
            eq(notifications.type, "streak_reminder"),
            gte(notifications.createdAt, today),
          ),
        });

        if (!alreadySent) {
          await db.insert(notifications).values({
            id: nanoid(),
            userId: user.id,
            type: "streak_reminder",
            title: "Don't break your streak!",
            message: "You logged yesterday — keep it going! Log today's outfit to maintain your streak.",
            actionUrl: "/streaks",
          });
          streakReminders++;
        }
      }

      // ── Challenge Nudges ──
      // If user has active challenges with unlogged days → remind them
      const activeProgress = await db.query.challengeProgress.findMany({
        where: and(
          eq(challengeProgress.userId, user.id),
          eq(challengeProgress.status, "active"),
        ),
      });

      for (const progress of activeProgress) {
        const completedDays = (progress.completedDays as string[]) || [];
        // Look up the challenge to get durationDays
        const challenge = await db.query.challenges.findFirst({
          where: eq(challenges.id, progress.challengeId),
          columns: { durationDays: true },
        });
        const totalDays = challenge?.durationDays || 7;
        const remaining = totalDays - completedDays.length;

        // Only nudge if they have 1-2 days left and haven't logged today
        if (remaining > 0 && remaining <= 2) {
          const todayLogged = completedDays.includes(today);
          if (!todayLogged) {
            const alreadySent = await db.query.notifications.findFirst({
              where: and(
                eq(notifications.userId, user.id),
                eq(notifications.type, "challenge_ending"),
                gte(notifications.createdAt, today),
              ),
            });

            if (!alreadySent) {
              await db.insert(notifications).values({
                id: nanoid(),
                userId: user.id,
                type: "challenge_ending",
                title: `${remaining} day${remaining === 1 ? "" : "s"} left!`,
                message: `Your style challenge is almost done — log today to earn your badge!`,
                actionUrl: "/challenges",
              });
              challengeNudges++;
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Notify] Error for user ${user.id}:`, err);
    }
  }

  return NextResponse.json({
    date: today,
    totalUsers: allUsers.length,
    streakReminders,
    challengeNudges,
  });
}
