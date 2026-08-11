// POST /api/feed/follow — toggle follow on a user

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { follows, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const FollowSchema = z.object({
  userId: z.string().max(50),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof FollowSchema>;
    try {
      body = FollowSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Can't follow yourself
    if (body.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existing = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, session.user.id),
        eq(follows.followingId, body.userId),
      ),
    });

    if (existing) {
      // Unfollow
      await db.delete(follows).where(eq(follows.id, existing.id));
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.insert(follows).values({
        id: nanoid(),
        followerId: session.user.id,
        followingId: body.userId,
      });

      // Notify the followed user (fire-and-forget)
      db.insert(notifications).values({
        id: nanoid(),
        userId: body.userId,
        type: "new_follower",
        title: "New follower!",
        message: `${session.user.name.split(" ")[0]} started following you.`,
        actionUrl: "/feed",
      }).catch(() => {});

      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error("[API] POST /api/feed/follow failed:", err);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}
