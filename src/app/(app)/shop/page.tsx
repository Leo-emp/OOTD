"use client";

// ── Shop For You ──
// AI-powered shopping recommendations based on wardrobe gaps
// Now includes budget filter for "Get this look for under $X" viral feature
// Budget tiers make fashion accessible — drives sharing + affiliate revenue

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag, Sparkles, ExternalLink, RefreshCw, DollarSign } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Budget filter options — the viral "get this look for under $X" feature
const BUDGET_TIERS = [
  { label: "All", max: Infinity, color: "text-neutral-300" },
  { label: "Under $25", max: 25, color: "text-green-400" },
  { label: "Under $50", max: 50, color: "text-blue-400" },
  { label: "Under $100", max: 100, color: "text-purple-400" },
  { label: "$100+", max: Infinity, min: 100, color: "text-yellow-400" },
] as const;

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
  const [budgetIndex, setBudgetIndex] = useState(0);

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

  // Filter recommendations by budget tier
  const activeBudget = BUDGET_TIERS[budgetIndex];
  const filteredRecs = recs.filter((rec) => {
    if (budgetIndex === 0) return true;
    const min = "min" in activeBudget ? activeBudget.min : 0;
    const max = activeBudget.max;
    if (min) return rec.item.price >= min;
    return rec.item.price <= max;
  });

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

        {/* Budget filter — "Get this look for under $X" */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-brand-purple" />
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Budget</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BUDGET_TIERS.map((tier, i) => (
              <button
                key={tier.label}
                onClick={() => setBudgetIndex(i)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                  budgetIndex === i
                    ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                    : "glass text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget banner — "get this look for under $X" */}
        {budgetIndex > 0 && budgetIndex < 4 && filteredRecs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 mb-4 text-center"
          >
            <p className="text-sm font-semibold text-white">
              Get the look for {activeBudget.label.toLowerCase()}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {filteredRecs.length} piece{filteredRecs.length !== 1 ? "s" : ""} in your budget
            </p>
          </motion.div>
        )}

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

        {/* No results for budget filter */}
        {!loading && recs.length > 0 && filteredRecs.length === 0 && (
          <div className="glass rounded-2xl p-6 text-center">
            <DollarSign size={24} className="mx-auto text-neutral-500 mb-2" />
            <p className="text-sm text-neutral-400">
              No items found {activeBudget.label.toLowerCase()}. Try a different budget range.
            </p>
          </div>
        )}

        {/* Recommendations list */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredRecs.map((rec, i) => {
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
