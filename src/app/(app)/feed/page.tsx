"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Plus, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

interface FeedPost {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  genreSlug: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
  liked: boolean;
  isOwn: boolean;
}

export default function FeedPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"trending" | "following">("trending");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Fetch feed
  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ tab });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchFeed();
  }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          fetchFeed(nextCursor);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchFeed]);

  // Toggle like
  async function handleLike(postId: string) {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    );

    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        )
      );
      toast("Failed to like", "error");
    }
  }

  // Time ago formatter
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  }

  // Genre label
  function genreLabel(slug: string): string {
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-heading text-2xl font-bold text-white">Community</h1>
          <Link
            href="/feed/post"
            className="flex items-center gap-1.5 gradient-bg rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={14} />
            Post
          </Link>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-5">
          <button
            onClick={() => setTab("trending")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              tab === "trending"
                ? "bg-brand-purple/20 text-brand-purple"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TrendingUp size={14} />
            Trending
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              tab === "following"
                ? "bg-brand-purple/20 text-brand-purple"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Users size={14} />
            Following
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-24 rounded bg-white/5" />
                  <div className="h-3 w-48 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <Users size={32} className="mx-auto text-brand-purple mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">
              {tab === "following" ? "No posts from people you follow" : "No posts yet"}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {tab === "following"
                ? "Follow stylists in the trending tab to see their OOTDs here."
                : "Be the first to share your outfit!"}
            </p>
            {tab === "following" && (
              <button
                onClick={() => setTab("trending")}
                className="gradient-bg rounded-xl px-6 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Browse Trending
              </button>
            )}
          </div>
        )}

        {/* Post grid */}
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, i) => {
              const accentColor = GENRE_COLORS[post.genreSlug] || "#8B5CF6";
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  {/* Author header */}
                  <div className="flex items-center gap-3 p-3 pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-pink text-xs font-bold text-white shrink-0">
                      {post.userName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{post.userName}</p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {genreLabel(post.genreSlug)}
                        </span>
                        <span className="text-[10px] text-neutral-600">{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <Link href={`/feed/${post.id}`} className="block mt-2">
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={post.imageUrl}
                        alt={post.caption || "Outfit post"}
                        fill
                        sizes="(max-width: 640px) 100vw, 512px"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Actions + caption */}
                  <div className="p-3">
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 text-sm transition cursor-pointer"
                      >
                        <Heart
                          size={18}
                          className={post.liked ? "text-red-400 fill-red-400" : "text-neutral-400"}
                        />
                        <span className={post.liked ? "text-red-400" : "text-neutral-500"}>
                          {post.likesCount}
                        </span>
                      </button>
                      <Link
                        href={`/feed/${post.id}`}
                        className="flex items-center gap-1 text-sm text-neutral-400 transition hover:text-neutral-200"
                      >
                        <MessageCircle size={18} />
                        <span className="text-neutral-500">{post.commentsCount}</span>
                      </Link>
                    </div>
                    {post.caption && (
                      <p className="text-sm text-neutral-300">
                        <span className="font-medium text-white">{post.userName}</span>{" "}
                        {post.caption}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Infinite scroll sentinel */}
        {nextCursor && <div ref={observerRef} className="h-10" />}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-purple" />
          </div>
        )}
      </main>
    </PageTransition>
  );
}
