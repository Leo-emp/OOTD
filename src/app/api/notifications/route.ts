// GET /api/notifications — user's notifications (latest 50, unread first)
// PATCH /api/notifications — mark notifications as read

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest 50 notifications, unread first then by date
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(notifications.read, desc(notifications.createdAt))
      .limit(50);

    // Count unread
    const unreadCount = notifs.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: notifs,
      unreadCount,
    });
  } catch (err) {
    console.error("[API] GET /api/notifications failed:", err);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

// Mark notifications as read
const MarkReadSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof MarkReadSchema>;
    try {
      body = MarkReadSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Only mark notifications belonging to this user
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          inArray(notifications.id, body.ids)
        )
      );

    return NextResponse.json({ marked: body.ids.length });
  } catch (err) {
    console.error("[API] PATCH /api/notifications failed:", err);
    return NextResponse.json({ error: "Failed to mark read" }, { status: 500 });
  }
}
