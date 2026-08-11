// GET /api/feed/[id] — single post detail with comments

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { outfitPosts, postLikes, postComments, follows, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the post with author info
    const [post] = await db
      .select({
        id: outfitPosts.id,
        userId: outfitPosts.userId,
        imageUrl: outfitPosts.imageUrl,
        caption: outfitPosts.caption,
        genreSlug: outfitPosts.genreSlug,
        outfitId: outfitPosts.outfitId,
        likesCount: outfitPosts.likesCount,
        commentsCount: outfitPosts.commentsCount,
        createdAt: outfitPosts.createdAt,
        userName: users.name,
        userAvatar: users.avatarUrl,
      })
      .from(outfitPosts)
      .innerJoin(users, eq(outfitPosts.userId, users.id))
      .where(eq(outfitPosts.id, id))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if current user liked this post
    const like = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, id), eq(postLikes.userId, session.user.id)),
    });

    // Check if current user follows the author
    const follow = post.userId !== session.user.id
      ? await db.query.follows.findFirst({
          where: and(
            eq(follows.followerId, session.user.id),
            eq(follows.followingId, post.userId),
          ),
        })
      : null;

    // Get comments with author names
    const comments = await db
      .select({
        id: postComments.id,
        userId: postComments.userId,
        message: postComments.message,
        createdAt: postComments.createdAt,
        userName: users.name,
        userAvatar: users.avatarUrl,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, id))
      .orderBy(postComments.createdAt);

    return NextResponse.json({
      post: {
        ...post,
        userName: post.userName.split(" ")[0],
        liked: !!like,
        following: !!follow,
        isOwn: post.userId === session.user.id,
      },
      comments: comments.map((c) => ({
        ...c,
        userName: c.userName.split(" ")[0],
        isOwn: c.userId === session.user.id,
      })),
    });
  } catch (err) {
    console.error("[API] GET /api/feed/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
