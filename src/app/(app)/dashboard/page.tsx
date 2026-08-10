"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { OutfitCardSkeleton } from "@/components/ui/Skeleton";
import { GenreSelector } from "@/components/genre/GenreSelector";
import { useOutfits } from "@/hooks/useOutfits";
import { Sparkles } from "lucide-react";

// All 12 genres — loaded from DB in production, hardcoded here for fast render
const GENRES = [
  { slug: "old-money", name: "Old Money" },
  { slug: "y2k", name: "Y2K" },
  { slug: "streetwear", name: "Streetwear" },
  { slug: "minimalist", name: "Minimalist" },
  { slug: "cottagecore", name: "Cottagecore" },
  { slug: "dark-academia", name: "Dark Academia" },
  { slug: "coastal-grandma", name: "Coastal Grandma" },
  { slug: "grunge", name: "Grunge" },
  { slug: "coquette", name: "Coquette" },
  { slug: "gorpcore", name: "Gorpcore" },
  { slug: "clean-girl", name: "Clean Girl" },
  { slug: "indie-boho", name: "Indie/Boho" },
];

export default function DashboardPage() {
  const [activeGenre, setActiveGenre] = useState("old-money");
  const [occasion, setOccasion] = useState("casual");
  const { currentOutfit, hasMore, loading, error, fetchOutfits, rateOutfit } = useOutfits();

  // Fetch outfits when genre or occasion changes
  useEffect(() => {
    fetchOutfits({ genre: activeGenre, occasion });
  }, [activeGenre, occasion, fetchOutfits]);

  return (
    <main className="px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white">
          Your Outfits
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Swipe through AI-curated looks for your style
        </p>
      </div>

      {/* Genre selector — horizontal scroll */}
      <div className="mb-6">
        <GenreSelector
          genres={GENRES}
          activeGenre={activeGenre}
          onSelect={setActiveGenre}
        />
      </div>

      {/* Occasion pills */}
      <div className="flex gap-2 mb-6">
        {["casual", "formal", "date", "work", "party"].map((occ) => (
          <button
            key={occ}
            onClick={() => setOccasion(occ)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
              occasion === occ
                ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                : "glass text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {occ}
          </button>
        ))}
      </div>

      {/* Outfit display */}
      <div className="max-w-lg mx-auto">
        {loading && <OutfitCardSkeleton />}

        {error && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchOutfits({ genre: activeGenre, occasion })}
              className="gradient-bg rounded-xl px-6 py-2 text-sm font-medium text-white cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && currentOutfit && (
          <AnimatePresence mode="wait">
            <OutfitCard
              key={currentOutfit.id}
              outfit={currentOutfit}
              onRate={rateOutfit}
            />
          </AnimatePresence>
        )}

        {!loading && !error && !hasMore && !currentOutfit && (
          <div className="glass rounded-2xl p-8 text-center">
            <Sparkles className="mx-auto mb-4 text-brand-purple" size={32} />
            <p className="text-neutral-300 font-medium">All caught up!</p>
            <p className="text-sm text-neutral-500 mt-1">
              Switch genres or occasions for fresh looks
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
