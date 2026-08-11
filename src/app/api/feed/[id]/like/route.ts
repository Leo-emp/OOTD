// POST /api/feed/[id]/like — toggle like on a post

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { postLikes, outfitPosts } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if already liked
    const existing = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, session.user.id)),
    });

    if (existing) {
      // Unlike — remove the like and decrement counter
      await db.delete(postLikes).where(eq(postLikes.id, existing.id));
      await db
        .update(outfitPosts)
        .set({ likesCount: sql`MAX(0, ${outfitPosts.likesCount} - 1)` })
        .where(eq(outfitPosts.id, postId));

      return NextResponse.json({ liked: false });
    } else {
      // Like — add like and increment counter
      await db.insert(postLikes).values({
        id: nanoid(),
        postId,
        userId: session.user.id,
      });
      await db
        .update(outfitPosts)
        .set({ likesCount: sql`${outfitPosts.likesCount} + 1` })
        .where(eq(outfitPosts.id, postId));

      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    console.error("[API] POST /api/feed/[id]/like failed:", err);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
