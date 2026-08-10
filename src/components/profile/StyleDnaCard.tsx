"use client";

import { motion } from "framer-motion";

// Genre display names + accent colors
const GENRE_DISPLAY: Record<string, { name: string; color: string }> = {
  "old-money": { name: "Old Money", color: "#C9B99A" },
  "y2k": { name: "Y2K", color: "#FF69B4" },
  "streetwear": { name: "Streetwear", color: "#FF4D4D" },
  "minimalist": { name: "Minimalist", color: "#94A3B8" },
  "cottagecore": { name: "Cottagecore", color: "#86EFAC" },
  "dark-academia": { name: "Dark Academia", color: "#8B7355" },
  "coastal-grandma": { name: "Coastal Grandma", color: "#38BDF8" },
  "grunge": { name: "Grunge", color: "#6B7280" },
  "coquette": { name: "Coquette", color: "#F9A8D4" },
  "gorpcore": { name: "Gorpcore", color: "#A78BFA" },
  "clean-girl": { name: "Clean Girl", color: "#2DD4BF" },
  "indie-boho": { name: "Indie/Boho", color: "#F97316" },
};

interface StyleDnaProps {
  primaryGenre: string;
  secondaryGenre?: string | null;
  accentGenre?: string | null;
  breakdown?: { genre: string; percentage: number }[];
  compact?: boolean;
}

// Style DNA card — shows the user's genre breakdown with animated bars
export function StyleDnaCard({ primaryGenre, secondaryGenre, accentGenre, breakdown, compact }: StyleDnaProps) {
  const primary = GENRE_DISPLAY[primaryGenre] || { name: primaryGenre, color: "#C084FC" };
  const secondary = secondaryGenre ? GENRE_DISPLAY[secondaryGenre] : null;
  const accent = accentGenre ? GENRE_DISPLAY[accentGenre] : null;

  // Build breakdown from genres if not provided
  const bars = breakdown || [
    { genre: primaryGenre, percentage: 60 },
    ...(secondaryGenre ? [{ genre: secondaryGenre, percentage: 25 }] : []),
    ...(accentGenre ? [{ genre: accentGenre, percentage: 15 }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 overflow-hidden relative"
    >
      {/* Gradient accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${primary.color}, ${secondary?.color || primary.color}, ${accent?.color || primary.color})`,
        }}
      />

      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: `${primary.color}20`, color: primary.color }}
        >
          DNA
        </div>
        <div>
          <h3 className="font-heading font-semibold text-white text-sm">
            {compact ? "Style DNA" : "Your Style DNA"}
          </h3>
          <p className="text-xs text-neutral-400">{primary.name} dominant</p>
        </div>
      </div>

      {/* Genre breakdown bars */}
      <div className="space-y-3">
        {bars.map((item, i) => {
          const genre = GENRE_DISPLAY[item.genre] || { name: item.genre, color: "#C084FC" };
          return (
            <div key={item.genre}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-neutral-300">{genre.name}</span>
                <span className="text-xs text-neutral-500">{item.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: genre.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Genre pills */}
      {!compact && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
          {[
            { label: "Primary", genre: primary, slug: primaryGenre },
            ...(secondary ? [{ label: "Secondary", genre: secondary, slug: secondaryGenre }] : []),
            ...(accent ? [{ label: "Accent", genre: accent, slug: accentGenre }] : []),
          ].map((item) => (
            <span
              key={item.slug}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ backgroundColor: `${item.genre.color}15`, color: item.genre.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.genre.color }} />
              {item.label}: {item.genre.name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
