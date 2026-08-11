// GET /api/feed?tab=trending|following&genre=old-money&cursor=xxx — paginated feed
// POST /api/feed — create a new outfit post

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { outfitPosts, postLikes, follows, users } from "@/lib/db/schema";
import { eq, and, desc, lt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { sanitizeForAI } from "@/lib/ai/sanitize";

// Post creation schema
const CreatePostSchema = z.object({
  imageUrl: z.string().url().max(500),
  caption: z.string().max(500).optional(),
  genreSlug: z.string().regex(/^[a-z0-9-]{1,30}$/),
  outfitId: z.string().max(50).optional(),
});

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "trending";
    const genre = searchParams.get("genre");
    const cursor = searchParams.get("cursor");

    let posts;

    if (tab === "following") {
      // Get IDs of users this person follows
      const userFollows = await db.query.follows.findMany({
        where: eq(follows.followerId, session.user.id),
      });
      const followingIds = userFollows.map((f) => f.followingId);

      if (followingIds.length === 0) {
        return NextResponse.json({ posts: [], nextCursor: null });
      }

      // Chronological feed from followed users
      posts = await db
        .select({
          id: outfitPosts.id,
          userId: outfitPosts.userId,
          imageUrl: outfitPosts.imageUrl,
          caption: outfitPosts.caption,
          genreSlug: outfitPosts.genreSlug,
          likesCount: outfitPosts.likesCount,
          commentsCount: outfitPosts.commentsCount,
          createdAt: outfitPosts.createdAt,
          userName: users.name,
          userAvatar: users.avatarUrl,
        })
        .from(outfitPosts)
        .innerJoin(users, eq(outfitPosts.userId, users.id))
        .where(
          and(
            inArray(outfitPosts.userId, followingIds),
            genre ? eq(outfitPosts.genreSlug, genre) : undefined,
            cursor ? lt(outfitPosts.createdAt, cursor) : undefined,
          )
        )
        .orderBy(desc(outfitPosts.createdAt))
        .limit(PAGE_SIZE + 1);
    } else {
      // Trending — most liked in last 7 days, then chronological
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      posts = await db
        .select({
          id: outfitPosts.id,
          userId: outfitPosts.userId,
          imageUrl: outfitPosts.imageUrl,
          caption: outfitPosts.caption,
          genreSlug: outfitPosts.genreSlug,
          likesCount: outfitPosts.likesCount,
          commentsCount: outfitPosts.commentsCount,
          createdAt: outfitPosts.createdAt,
          userName: users.name,
          userAvatar: users.avatarUrl,
        })
        .from(outfitPosts)
        .innerJoin(users, eq(outfitPosts.userId, users.id))
        .where(
          and(
            genre ? eq(outfitPosts.genreSlug, genre) : undefined,
            cursor ? lt(outfitPosts.createdAt, cursor) : undefined,
          )
        )
        .orderBy(desc(outfitPosts.likesCount), desc(outfitPosts.createdAt))
        .limit(PAGE_SIZE + 1);
    }

    // Check if current user liked each post
    const postIds = posts.slice(0, PAGE_SIZE).map((p) => p.id);
    const userLikes = postIds.length > 0
      ? await db.query.postLikes.findMany({
          where: and(
            eq(postLikes.userId, session.user.id),
            inArray(postLikes.postId, postIds),
          ),
        })
      : [];
    const likedSet = new Set(userLikes.map((l) => l.postId));

    // Paginate
    const hasMore = posts.length > PAGE_SIZE;
    const pageData = posts.slice(0, PAGE_SIZE);

    return NextResponse.json({
      posts: pageData.map((p) => ({
        ...p,
        userName: p.userName.split(" ")[0], // first name only for privacy
        liked: likedSet.has(p.id),
        isOwn: p.userId === session.user.id,
      })),
      nextCursor: hasMore ? pageData[pageData.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error("[API] GET /api/feed failed:", err);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: z.infer<typeof CreatePostSchema>;
    try {
      body = CreatePostSchema.parse(await request.json());
    } catch {
      return NextResponse.json({ error: "Invalid post data" }, { status: 400 });
    }

    const postId = nanoid();
    const sanitizedCaption = body.caption ? sanitizeForAI(body.caption) : null;

    await db.insert(outfitPosts).values({
      id: postId,
      userId: session.user.id,
      imageUrl: body.imageUrl,
      caption: sanitizedCaption,
      genreSlug: body.genreSlug,
      outfitId: body.outfitId,
    });

    return NextResponse.json({ id: postId, created: true });
  } catch (err) {
    console.error("[API] POST /api/feed failed:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
