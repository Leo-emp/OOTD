"use client";

// ── Genre Trending Graph ──
// SVG-based mini sparkline graph showing which genres are rising/falling
// Displayed at the top of the community feed for engagement + FOMO
// Data-driven — fetches from /api/feed/trending

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GENRE_COLORS } from "@/lib/constants";

interface GenreTrend {
  genre: string;
  name: string;
  direction: "up" | "down" | "stable";
  percentage: number;
  sparkline: number[];
}

export function GenreTrending() {
  const [trends, setTrends] = useState<GenreTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed/trending")
      .then((r) => r.json())
      .then((data) => {
        if (data.trends) setTrends(data.trends);
      })
      .catch(() => {
        // Fallback demo data when API not ready
        setTrends([
          { genre: "old-money", name: "Old Money", direction: "up", percentage: 24, sparkline: [2, 4, 3, 6, 8, 7, 9] },
          { genre: "coquette", name: "Coquette", direction: "up", percentage: 18, sparkline: [1, 2, 3, 3, 5, 6, 7] },
          { genre: "streetwear", name: "Streetwear", direction: "stable", percentage: 15, sparkline: [5, 6, 5, 7, 6, 5, 6] },
          { genre: "grunge", name: "Grunge", direction: "up", percentage: 12, sparkline: [1, 1, 2, 2, 3, 4, 5] },
          { genre: "minimalist", name: "Minimalist", direction: "down", percentage: 10, sparkline: [8, 7, 6, 5, 5, 4, 4] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Convert sparkline data to SVG path
  function sparklinePath(data: number[]): string {
    if (data.length < 2) return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 64;
    const h = 24;
    const stepX = w / (data.length - 1);

    return data
      .map((val, i) => {
        const x = i * stepX;
        const y = h - ((val - min) / range) * h;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // Direction icon + color
  function directionIcon(dir: string) {
    if (dir === "up") return <TrendingUp size={12} className="text-green-400" />;
    if (dir === "down") return <TrendingDown size={12} className="text-red-400" />;
    return <Minus size={12} className="text-neutral-500" />;
  }

  function directionColor(dir: string) {
    if (dir === "up") return "text-green-400";
    if (dir === "down") return "text-red-400";
    return "text-neutral-500";
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-4 mb-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-white/5 mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-32 rounded-xl bg-white/5 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (trends.length === 0) return null;

  return (
    <div className="mb-5">
      <h3 className="text-xs text-neutral-500 uppercase tracking-wider mb-2 px-1">Trending Now</h3>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        {trends.map((trend, i) => {
          const accentColor = GENRE_COLORS[trend.genre] || "#C084FC";
          return (
            <motion.div
              key={trend.genre}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-3 min-w-[140px] shrink-0"
              style={{ borderBottom: `2px solid ${accentColor}` }}
            >
              {/* Genre name + direction */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white">{trend.name}</span>
                {directionIcon(trend.direction)}
              </div>

              {/* Sparkline SVG */}
              <div className="flex items-end justify-between gap-2">
                <svg width="64" height="24" viewBox="0 0 64 24" className="shrink-0">
                  <path
                    d={sparklinePath(trend.sparkline)}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={`text-xs font-bold ${directionColor(trend.direction)}`}>
                  {trend.direction === "down" ? "" : "+"}{trend.percentage}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
