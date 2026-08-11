"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Dna, Palette, TrendingUp, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Taste profile shape from API
interface TasteProfile {
  colorAffinities: Record<string, number>;
  brandAffinities: Record<string, number>;
  genreWeights: Record<string, number>;
  priceRange: { min: number; max: number; mean: number };
  dimensions: {
    formalityCasual: number;
    boldnessMinimal: number;
    trendClassic: number;
  };
  confidence: number;
  lastComputed: string | null;
}

// Style dimension — maps 0-1 scale to human-readable labels
function DimensionBar({ label, leftLabel, rightLabel, value }: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-500">{pct}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink"
        />
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-neutral-500">{leftLabel}</span>
        <span className="text-[10px] text-neutral-500">{rightLabel}</span>
      </div>
    </div>
  );
}

export default function TastePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  // Load taste profile
  useEffect(() => {
    fetch("/api/taste")
      .then((r) => r.json())
      .then((data) => {
        if (data.taste) setTaste(data.taste);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Recompute taste profile
  async function handleRecompute() {
    setRecomputing(true);
    try {
      const res = await fetch("/api/taste", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Reload full profile after recomputation
      const full = await fetch("/api/taste").then((r) => r.json());
      if (full.taste) setTaste(full.taste);
      toast(`Style DNA updated from ${data.taste?.confidence || 0} interactions`, "success");
    } catch {
      toast("Failed to recompute", "error");
    } finally {
      setRecomputing(false);
    }
  }

  // Get top N entries from a record
  function topEntries(record: Record<string, number>, n: number) {
    return Object.entries(record)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n);
  }

  // Pretty-print genre slug
  function genreLabel(slug: string): string {
    return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
              <h1 className="font-heading text-xl font-bold text-white">Your Style DNA</h1>
              <p className="text-xs text-neutral-500">Built from every outfit you rate, save, and wear</p>
            </div>
          </div>
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-xs text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw size={14} className={recomputing ? "animate-spin" : ""} />
            {recomputing ? "Computing..." : "Refresh"}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-4 w-32 rounded bg-white/5 mb-4" />
                <div className="h-2 w-full rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state — not enough data */}
        {!loading && !taste && (
          <div className="glass rounded-2xl p-8 text-center">
            <Dna size={40} className="mx-auto text-brand-purple mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">Your Style DNA is forming</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Rate outfits, log your daily looks, and build your wardrobe. We&apos;ll map your unique taste.
            </p>
            <button
              onClick={handleRecompute}
              disabled={recomputing}
              className="gradient-bg rounded-xl px-6 py-2 text-sm font-semibold text-white cursor-pointer"
            >
              {recomputing ? "Computing..." : "Compute Now"}
            </button>
          </div>
        )}

        {/* Taste profile visualization */}
        {!loading && taste && (
          <div className="space-y-4">
            {/* Confidence badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10">
                <Dna size={24} className="text-brand-purple" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-400">Confidence</p>
                <p className="text-lg font-bold text-white">{taste.confidence} interactions</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">
                  {taste.confidence < 10 ? "Learning..." : taste.confidence < 50 ? "Growing" : taste.confidence < 200 ? "Strong" : "Expert"}
                </p>
                <div className="mt-1 h-1.5 w-20 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-pink"
                    style={{ width: `${Math.min(100, (taste.confidence / 200) * 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Style dimensions — the core taste fingerprint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-purple" />
                <h3 className="text-sm font-semibold text-white">Style Dimensions</h3>
              </div>
              <div className="space-y-5">
                <DimensionBar
                  label="Formality"
                  leftLabel="Formal"
                  rightLabel="Casual"
                  value={taste.dimensions.formalityCasual}
                />
                <DimensionBar
                  label="Expression"
                  leftLabel="Bold"
                  rightLabel="Minimal"
                  value={taste.dimensions.boldnessMinimal}
                />
                <DimensionBar
                  label="Era"
                  leftLabel="Trendy"
                  rightLabel="Classic"
                  value={taste.dimensions.trendClassic}
                />
              </div>
            </motion.div>

            {/* Genre weights — what styles resonate most */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Dna size={16} className="text-brand-purple" />
                <h3 className="text-sm font-semibold text-white">Genre Affinity</h3>
              </div>
              <div className="space-y-2.5">
                {topEntries(taste.genreWeights, 6).map(([slug, weight], i) => {
                  const color = GENRE_COLORS[slug] || "#8B5CF6";
                  const maxWeight = Math.max(...Object.values(taste.genreWeights), 1);
                  const pct = Math.round((weight / maxWeight) * 100);
                  return (
                    <motion.div
                      key={slug}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-200">{genreLabel(slug)}</span>
                        <span className="text-[10px] text-neutral-500">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.05 * i }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Color affinities */}
            {Object.keys(taste.colorAffinities).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-brand-purple" />
                  <h3 className="text-sm font-semibold text-white">Color Palette</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topEntries(taste.colorAffinities, 8).map(([color, weight]) => (
                    <div
                      key={color}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 bg-white/5"
                    >
                      <div
                        className="h-3 w-3 rounded-full border border-white/20"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      <span className="text-xs text-neutral-300 capitalize">{color}</span>
                      <span className="text-[10px] text-neutral-500">{Math.round(weight)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Price range */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} className="text-brand-purple" />
                <h3 className="text-sm font-semibold text-white">Price Sweet Spot</h3>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Min</p>
                  <p className="text-lg font-bold text-white">${taste.priceRange.min}</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-brand-purple/30 to-white/5" />
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Avg</p>
                  <p className="text-lg font-bold text-brand-purple">${taste.priceRange.mean}</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-brand-purple/30 to-white/5" />
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Max</p>
                  <p className="text-lg font-bold text-white">${taste.priceRange.max}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
