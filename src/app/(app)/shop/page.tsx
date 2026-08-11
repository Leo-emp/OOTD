"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Recommendation shape from API
interface ShopRecommendation {
  id: string;
  reason: string;
  matchScore: number;
  category: string;
  genreSlug: string;
  item: {
    id: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    affiliateUrl: string | null;
    color: string;
  };
}

export default function ShopPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [recs, setRecs] = useState<ShopRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Load existing recommendations
  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((data) => {
        if (data.recommendations) setRecs(data.recommendations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Generate new AI recommendations
  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/shop", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to generate", "error");
        return;
      }

      // Reload recommendations
      const reload = await fetch("/api/shop").then((r) => r.json());
      if (reload.recommendations) setRecs(reload.recommendations);
      toast("New recommendations generated!", "success");
    } catch {
      toast("Failed to generate recommendations", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Match score color — green/yellow/orange gradient
  function scoreColor(score: number): string {
    if (score >= 80) return "#22C55E";
    if (score >= 60) return "#EAB308";
    return "#F97316";
  }

  // Category icon
  function categoryLabel(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-heading text-xl font-bold text-white">Shop For You</h1>
              <p className="text-xs text-neutral-500">AI picks based on your wardrobe gaps</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 gradient-bg rounded-xl px-3 py-2 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generating ? "Analyzing..." : "Generate"}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-4 animate-pulse flex gap-4">
                <div className="h-24 w-24 rounded-xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-white/5" />
                  <div className="h-3 w-48 rounded bg-white/5" />
                  <div className="h-3 w-20 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && recs.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <ShoppingBag size={40} className="mx-auto text-brand-purple mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">Personalized Shopping</h3>
            <p className="text-xs text-neutral-400 mb-4">
              AI analyzes your wardrobe to find pieces that complete your outfits. Upload some clothes first, then hit Generate.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="gradient-bg rounded-xl px-6 py-2 text-sm font-semibold text-white cursor-pointer"
            >
              {generating ? "Analyzing Your Wardrobe..." : "Generate Recommendations"}
            </button>
          </div>
        )}

        {/* Recommendations list */}
        <div className="space-y-3">
          <AnimatePresence>
            {recs.map((rec, i) => {
              const accentColor = GENRE_COLORS[rec.genreSlug] || "#8B5CF6";
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex gap-4">
                    {/* Item image */}
                    {rec.item.imageUrl ? (
                      <div className="h-24 w-24 rounded-xl overflow-hidden relative shrink-0">
                        <Image
                          src={rec.item.imageUrl}
                          alt={rec.item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <ShoppingBag size={24} className="text-neutral-600" />
                      </div>
                    )}

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{rec.item.name}</p>
                          <p className="text-xs text-neutral-400">{rec.item.brand}</p>
                        </div>
                        {/* Match score badge */}
                        <div
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: `${scoreColor(rec.matchScore)}15`,
                            color: scoreColor(rec.matchScore),
                          }}
                        >
                          {rec.matchScore}%
                        </div>
                      </div>

                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {rec.genreSlug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-neutral-400">
                          {categoryLabel(rec.category)}
                        </span>
                      </div>

                      {/* Price + shop link */}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-bold text-white">${rec.item.price}</p>
                        {rec.item.affiliateUrl && (
                          <a
                            href={rec.item.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-pink transition"
                          >
                            Shop <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI reason */}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      <Sparkles size={10} className="inline mr-1 text-brand-purple" />
                      {rec.reason}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  );
}
