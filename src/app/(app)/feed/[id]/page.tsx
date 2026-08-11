"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Send, UserPlus, UserCheck } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Post detail shape from API
interface PostDetail {
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
  following: boolean;
  isOwn: boolean;
}

// Comment shape from API
interface Comment {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  userName: string;
  userAvatar: string | null;
  isOwn: boolean;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { toast } = useToast();
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load post detail
  useEffect(() => {
    fetch(`/api/feed/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.post) setPost(data.post);
        if (data.comments) setComments(data.comments);
      })
      .catch(() => toast("Failed to load post", "error"))
      .finally(() => setLoading(false));
  }, [postId, toast]);

  // Toggle like with optimistic update
  async function handleLike() {
    if (!post) return;
    setPost({
      ...post,
      liked: !post.liked,
      likesCount: post.liked ? post.likesCount - 1 : post.likesCount + 1,
    });
    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setPost((prev) =>
        prev
          ? { ...prev, liked: !prev.liked, likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1 }
          : prev
      );
    }
  }

  // Toggle follow
  async function handleFollow() {
    if (!post || post.isOwn) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/feed/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: post.userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, following: data.following });
      }
    } catch {
      toast("Failed to follow", "error");
    } finally {
      setFollowLoading(false);
    }
  }

  // Submit comment
  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const msg = newComment.trim();
    if (!msg || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Add to comments list
      setComments((prev) => [...prev, { ...data, isOwn: true, userAvatar: null }]);
      // Increment count on post
      setPost((prev) => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
      setNewComment("");
    } catch {
      toast("Failed to comment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Time ago
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  // Genre display
  function genreLabel(slug: string): string {
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  if (loading) {
    return (
      <PageTransition>
        <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
          <div className="glass rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-white/5" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-32 rounded bg-white/5" />
              <div className="h-4 w-48 rounded bg-white/5" />
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }

  if (!post) {
    return (
      <PageTransition>
        <main className="px-4 pt-6 pb-24 max-w-lg mx-auto text-center">
          <p className="text-neutral-400">Post not found.</p>
          <button onClick={() => router.push("/feed")} className="text-brand-purple text-sm mt-2 cursor-pointer">
            Back to feed
          </button>
        </main>
      </PageTransition>
    );
  }

  const accentColor = GENRE_COLORS[post.genreSlug] || "#8B5CF6";

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer mb-4"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Post card */}
        <div className="glass rounded-2xl overflow-hidden mb-4">
          {/* Author header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-pink text-sm font-bold text-white shrink-0">
                {post.userName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{post.userName}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    {genreLabel(post.genreSlug)}
                  </span>
                  <span className="text-[10px] text-neutral-500">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Follow button — only for other users */}
            {!post.isOwn && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  post.following
                    ? "bg-white/5 text-neutral-300 border border-white/10"
                    : "gradient-bg text-white"
                }`}
              >
                {post.following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                {post.following ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Image */}
          <div className="aspect-[3/4] relative">
            <Image
              src={post.imageUrl}
              alt={post.caption || "Outfit post"}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              priority
            />
          </div>

          {/* Actions row */}
          <div className="p-4">
            <div className="flex items-center gap-5 mb-3">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 transition cursor-pointer"
              >
                <motion.div
                  key={post.liked ? "liked" : "not"}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Heart
                    size={22}
                    className={post.liked ? "text-red-400 fill-red-400" : "text-neutral-400"}
                  />
                </motion.div>
                <span className={`text-sm font-medium ${post.liked ? "text-red-400" : "text-neutral-400"}`}>
                  {post.likesCount}
                </span>
              </button>
              <button
                onClick={() => commentInputRef.current?.focus()}
                className="flex items-center gap-1.5 text-neutral-400 cursor-pointer"
              >
                <Send size={20} />
                <span className="text-sm">{post.commentsCount}</span>
              </button>
            </div>

            {/* Caption */}
            {post.caption && (
              <p className="text-sm text-neutral-200 leading-relaxed">
                <span className="font-semibold text-white mr-1">{post.userName}</span>
                {post.caption}
              </p>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Comments {post.commentsCount > 0 && `(${post.commentsCount})`}
          </h3>

          {/* Comments list */}
          <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {comments.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white shrink-0 mt-0.5">
                      {c.userName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white">{c.userName}</span>
                        <span className="text-[10px] text-neutral-600">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5 break-words">{c.message}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 300))}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-white disabled:opacity-50 cursor-pointer shrink-0"
            >
              {submitting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
        </div>
      </main>
    </PageTransition>
  );
}
