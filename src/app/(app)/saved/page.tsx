"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart, Clock, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SavedListSkeleton } from "@/components/ui/ContentSkeleton";
import { PageTransition } from "@/components/ui/PageTransition";

// Saved outfit shape from the API (includes rating metadata)
interface SavedOutfit {
  id: string;
  genreSlug: string;
  occasion: string;
  weather?: string;
  items: Array<{
    itemId: string;
    itemType: "catalog" | "wardrobe";
    position: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    affiliateUrl: string;
    color: string;
  }>;
  styleExplanation: string;
  totalPrice: number;
  source: string;
  rating: "love" | "skip" | "hate";
  ratedAt: string;
}

export default function SavedPage() {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  // "saved" = loved only, "history" = all ratings
  const [tab, setTab] = useState<"saved" | "history">("saved");

  useEffect(() => {
    setLoading(true);
    const url = tab === "history" ? "/api/outfits/saved?all=true" : "/api/outfits/saved";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setOutfits(data.outfits || []))
      .catch(() => setOutfits([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <PageTransition>
    <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-white">My Outfits</h1>
      </div>

      {/* Tabs — Saved vs History */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("saved")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition cursor-pointer ${
            tab === "saved"
              ? "bg-brand-pink/20 text-brand-pink border border-brand-pink/30"
              : "glass text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Heart size={14} />
          Saved ({tab === "saved" ? outfits.length : "..."})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition cursor-pointer ${
            tab === "history"
              ? "bg-white/10 text-white border border-white/20"
              : "glass text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Clock size={14} />
          History
        </button>
      </div>

      {/* Loading state — content-aware skeleton shapes */}
      {loading && <SavedListSkeleton />}

      {/* Empty state — branded SVG illustrations */}
      {!loading && outfits.length === 0 && (
        tab === "saved" ? (
          <EmptyState
            variant="saved"
            title="No saved outfits yet"
            description="Tap the heart on outfits you love and they'll show up here"
            actionLabel="Browse Outfits"
            actionHref="/dashboard"
          />
        ) : (
          <EmptyState
            variant="history"
            title="No outfit history"
            description="Start swiping outfits to build your style history"
            actionLabel="Get Started"
            actionHref="/dashboard"
          />
        )
      )}

      {/* Outfit cards */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {outfits.map((outfit, i) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/outfit/${outfit.id}`}
                onClick={() => {
                  try { sessionStorage.setItem(`outfit-${outfit.id}`, JSON.stringify(outfit)); } catch {}
                }}
                className="block glass rounded-2xl p-4 transition hover:bg-white/[0.06]"
              >
                {/* Item thumbnails row */}
                <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                  {outfit.items.slice(0, 4).map((item) => (
                    <div key={item.itemId} className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-white/5">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-[9px] text-neutral-500 text-center px-1">{item.brand}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {outfit.items.length > 4 && (
                    <div className="w-20 h-28 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                      <span className="text-xs text-neutral-400">+{outfit.items.length - 4}</span>
                    </div>
                  )}
                </div>

                {/* Outfit info */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">
                      {outfit.styleExplanation.split(".")[0] || "Outfit"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-400 capitalize">
                        {(outfit.genreSlug || "").replace(/-/g, " ")}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-xs text-neutral-400 capitalize">{outfit.occasion}</span>
                      {outfit.totalPrice > 0 && (
                        <>
                          <span className="text-neutral-600">·</span>
                          <span className="text-xs text-brand-purple">${outfit.totalPrice.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rating badge (only in history view) */}
                  {tab === "history" && (
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      outfit.rating === "love"
                        ? "bg-brand-pink/10 text-brand-pink"
                        : outfit.rating === "hate"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-white/5 text-neutral-400"
                    }`}>
                      {outfit.rating === "love" ? "Loved" : outfit.rating === "hate" ? "Passed" : "Skipped"}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </main>
    </PageTransition>
  );
}
