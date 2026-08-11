"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Genre accent colors for visual distinction
const GENRE_COLORS: Record<string, string> = {
  "old-money": "bg-genre-old-money",
  "y2k": "bg-genre-y2k",
  "streetwear": "bg-genre-streetwear",
  "minimalist": "bg-genre-minimalist",
  "cottagecore": "bg-genre-cottagecore",
  "dark-academia": "bg-genre-dark-academia",
  "coastal-grandma": "bg-genre-coastal",
  "grunge": "bg-genre-grunge",
  "coquette": "bg-genre-y2k",
  "gorpcore": "bg-genre-athleisure",
  "clean-girl": "bg-genre-preppy",
  "indie-boho": "bg-genre-bohemian",
};

interface Genre {
  slug: string;
  name: string;
}

// Horizontal scrollable genre selector — pill badges
export function GenreSelector({
  genres,
  activeGenre,
  onSelect,
}: {
  genres: readonly Genre[];
  activeGenre: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {genres.map((genre) => (
        <motion.button
          key={genre.slug}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(genre.slug)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer",
            activeGenre === genre.slug
              ? "bg-white/15 text-white border border-white/20"
              : "glass text-neutral-400 hover:text-neutral-200"
          )}
        >
          {/* Genre color dot */}
          <span className="inline-flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", GENRE_COLORS[genre.slug] || "bg-neutral-400")} />
            {genre.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
