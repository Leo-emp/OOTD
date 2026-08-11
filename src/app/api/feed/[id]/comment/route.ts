// POST /api/feed/[id]/comment — add a comment to a post

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { postComments, outfitPosts, notifications } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { sanitizeForAI } from "@/lib/ai/sanitize";

const CommentSchema = z.object({
  message: z.string().min(1).max(300),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    let body: z.infer<typeof CommentSchema>;
    try {
      body = CommentSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
    }

    const commentId = nanoid();
    const sanitized = sanitizeForAI(body.message);

    await db.insert(postComments).values({
      id: commentId,
      postId,
      userId: session.user.id,
      message: sanitized,
    });

    // Increment comment count
    await db
      .update(outfitPosts)
      .set({ commentsCount: sql`${outfitPosts.commentsCount} + 1` })
      .where(eq(outfitPosts.id, postId));

    // Notify post owner (fire-and-forget)
    const post = await db.query.outfitPosts.findFirst({
      where: eq(outfitPosts.id, postId),
      columns: { userId: true },
    });
    if (post && post.userId !== session.user.id) {
      db.insert(notifications).values({
        id: nanoid(),
        userId: post.userId,
        type: "post_comment",
        title: "New comment on your post",
        message: `${session.user.name.split(" ")[0]}: "${sanitized.slice(0, 80)}${sanitized.length > 80 ? "..." : ""}"`,
        actionUrl: `/feed/${postId}`,
      }).catch(() => {});
    }

    return NextResponse.json({
      id: commentId,
      message: sanitized,
      userName: session.user.name.split(" ")[0],
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API] POST /api/feed/[id]/comment failed:", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
