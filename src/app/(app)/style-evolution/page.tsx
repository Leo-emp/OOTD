"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Snapshot from the API
interface Snapshot {
  id: string;
  month: string;
  genreBreakdown: Record<string, number>;
  totalOutfits: number;
  topGenre: string;
}

// Format genre slug for display
function genreLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function StyleEvolutionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);

  // Fetch snapshots
  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch("/api/style-evolution");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Capture current month's snapshot
  async function handleCapture() {
    setCapturing(true);
    try {
      const res = await fetch("/api/style-evolution", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to capture snapshot", "error");
        return;
      }
      toast("Style snapshot captured!", "success");
      fetchSnapshots();
    } catch {
      toast("Failed to capture snapshot", "error");
    } finally {
      setCapturing(false);
    }
  }

  // Get all unique genres across all snapshots
  function getAllGenres(): string[] {
    const genreSet = new Set<string>();
    for (const snap of snapshots) {
      for (const genre of Object.keys(snap.genreBreakdown)) {
        genreSet.add(genre);
      }
    }
    return Array.from(genreSet);
  }

  // Format month for display ("2026-08" → "Aug 2026")
  function formatMonth(m: string): string {
    const [year, month] = m.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }

  if (loading) {
    return (
      <main className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-white/5" />
          <div className="h-60 rounded-2xl bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  const allGenres = getAllGenres();

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
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-white">Style Evolution</h1>
            <p className="text-xs text-neutral-500">See how your taste changes over time</p>
          </div>
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={capturing ? "animate-spin" : ""} />
            {capturing ? "..." : "Capture"}
          </button>
        </div>

        {snapshots.length === 0 ? (
          /* Empty state */
          <div className="glass rounded-2xl p-8 text-center">
            <BarChart3 size={32} className="mx-auto text-brand-purple mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">No data yet</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Start logging outfits and rating looks. Your style evolution will appear here as data
              builds up month over month.
            </p>
            <button
              onClick={handleCapture}
              disabled={capturing}
              className="gradient-bg rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
            >
              {capturing ? "Capturing..." : "Capture First Snapshot"}
            </button>
          </div>
        ) : (
          <>
            {/* Timeline chart — stacked horizontal bars per month */}
            <div className="glass rounded-2xl p-4 mb-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-purple" />
                Genre Mix Over Time
              </h3>
              <div className="space-y-3">
                {snapshots.map((snap, i) => (
                  <motion.div
                    key={snap.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-400">{formatMonth(snap.month)}</span>
                      <span className="text-[10px] text-neutral-500">
                        {snap.totalOutfits} outfits
                      </span>
                    </div>
                    {/* Stacked bar */}
                    <div className="flex h-6 rounded-lg overflow-hidden bg-white/5">
                      {Object.entries(snap.genreBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([genre, pct]) => (
                          <div
                            key={genre}
                            className="h-full transition-all duration-500 relative group"
                            style={{
                              width: `${Math.max(pct, 3)}%`,
                              backgroundColor: GENRE_COLORS[genre] || "#8B5CF6",
                              opacity: 0.7,
                            }}
                            title={`${genreLabel(genre)}: ${pct}%`}
                          >
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                              <div className="bg-black/90 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap">
                                {genreLabel(genre)}: {pct}%
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="glass rounded-2xl p-4 mb-5">
              <h3 className="text-xs text-neutral-400 mb-3 uppercase tracking-wider">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((genre) => (
                  <div key={genre} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: GENRE_COLORS[genre] || "#8B5CF6" }}
                    />
                    <span className="text-xs text-neutral-300">{genreLabel(genre)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly summaries */}
            <div className="space-y-3">
              {[...snapshots].reverse().map((snap, i) => (
                <motion.div
                  key={snap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">{formatMonth(snap.month)}</h4>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${GENRE_COLORS[snap.topGenre] || "#8B5CF6"}20`,
                        color: GENRE_COLORS[snap.topGenre] || "#8B5CF6",
                      }}
                    >
                      {genreLabel(snap.topGenre)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(snap.genreBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([genre, pct]) => (
                        <div key={genre} className="flex items-center gap-2">
                          <div
                            className="h-1.5 rounded-full flex-1"
                            style={{ backgroundColor: `${GENRE_COLORS[genre] || "#8B5CF6"}30` }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: GENRE_COLORS[genre] || "#8B5CF6",
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-500 w-12 text-right">
                            {genreLabel(genre).split(" ")[0]} {pct}%
                          </span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </PageTransition>
  );
}
