"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Leaf, AlertTriangle, CheckCircle, Sparkles, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRES, GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Audit result from the API
interface AuditResult {
  genreSlug: string;
  missingItems: { category: string; suggestion: string; priority: "essential" | "nice-to-have" }[];
  score: number;
  summary: string;
  createdAt?: string;
}

export default function SeasonalRefreshPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [season, setSeason] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("old-money");

  // Fetch existing audit
  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/seasonal-refresh");
      if (res.ok) {
        const data = await res.json();
        setSeason(data.season);
        if (data.audit) {
          setAudit(data.audit);
          setSelectedGenre(data.audit.genreSlug);
        }
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  // Run AI analysis
  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/seasonal-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreSlug: selectedGenre }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to analyze", "error");
        return;
      }
      const data = await res.json();
      setAudit(data.audit);
      setSeason(data.season);
      toast("Wardrobe analysis complete!", "success");
    } catch {
      toast("Failed to analyze wardrobe", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  // Score ring color
  function scoreColor(score: number): string {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  }

  function scoreRing(score: number): string {
    if (score >= 75) return "from-green-400 to-emerald-500";
    if (score >= 50) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-rose-500";
  }

  // Format season label ("fall-2026" → "Fall 2026")
  function seasonLabel(s: string): string {
    const [name, year] = s.split("-");
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
  }

  if (loading) {
    return (
      <main className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5" />
          <div className="h-60 rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">Seasonal Refresh</h1>
            <p className="text-xs text-neutral-500">
              {season ? seasonLabel(season) : "Loading..."} wardrobe gap analysis
            </p>
          </div>
        </div>

        {/* Genre selector */}
        <div className="mb-5">
          <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Analyze for genre</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.slug}
                onClick={() => {
                  setSelectedGenre(g.slug);
                  if (audit?.genreSlug !== g.slug) setAudit(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedGenre === g.slug
                    ? "text-white border"
                    : "glass text-neutral-400 hover:text-neutral-200"
                }`}
                style={
                  selectedGenre === g.slug
                    ? {
                        backgroundColor: `${GENRE_COLORS[g.slug]}20`,
                        borderColor: `${GENRE_COLORS[g.slug]}50`,
                        color: GENRE_COLORS[g.slug],
                      }
                    : undefined
                }
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        {!audit || audit.genreSlug !== selectedGenre ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 mb-6 disabled:opacity-50 cursor-pointer"
          >
            {analyzing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Analyzing your wardrobe...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze My Wardrobe
              </>
            )}
          </motion.button>
        ) : null}

        {/* Results */}
        {audit && audit.genreSlug === selectedGenre && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Readiness score */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${scoreRing(audit.score)} opacity-20 blur-sm`} />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                  <span className={`font-heading text-3xl font-bold ${scoreColor(audit.score)}`}>
                    {audit.score}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-300">{audit.summary}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Leaf size={12} className="text-green-400" />
                <span className="text-xs text-neutral-500">{seasonLabel(season)} readiness</span>
              </div>
            </div>

            {/* Missing items */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ShoppingBag size={14} className="text-brand-purple" />
                What You Need
              </h3>
              <div className="space-y-3">
                {audit.missingItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                      item.priority === "essential"
                        ? "bg-red-500/10"
                        : "bg-yellow-500/10"
                    }`}>
                      {item.priority === "essential" ? (
                        <AlertTriangle size={10} className="text-red-400" />
                      ) : (
                        <CheckCircle size={10} className="text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-200">{item.suggestion}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral-500 capitalize">{item.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.priority === "essential"
                            ? "text-red-400 bg-red-400/10"
                            : "text-yellow-400 bg-yellow-400/10"
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Re-analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
            >
              {analyzing ? "Re-analyzing..." : "Re-analyze"}
            </button>
          </motion.div>
        )}
      </main>
    </PageTransition>
  );
}
