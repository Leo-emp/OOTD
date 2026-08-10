"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { OutfitCardSkeleton } from "@/components/ui/ContentSkeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { GenreSelector } from "@/components/genre/GenreSelector";
import { useOutfits } from "@/hooks/useOutfits";
import { useEngagement } from "@/hooks/useEngagement";
import { useWeather } from "@/hooks/useWeather";
import { Sparkles, Compass, MapPin, CloudSun, Shirt, Palette, Camera, Pin } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth/client";

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
  const { data: session } = useSession();
  const [activeGenre, setActiveGenre] = useState("old-money");
  const [occasion, setOccasion] = useState("casual");
  const [isNewUser, setIsNewUser] = useState(false);
  const [dismissedWelcome, setDismissedWelcome] = useState(false);
  const { currentOutfit, currentIndex, hasMore, loading, error, fetchOutfits, rateOutfit, prefetch } = useOutfits();
  const { trackView, trackSave, flush } = useEngagement();
  const { weather } = useWeather();

  // Auto-pass weather to outfit generation when available
  const weatherParam = weather?.outfitWeather;

  // Track outfit views — fires when a new outfit is displayed
  useEffect(() => {
    if (currentOutfit) {
      trackView(currentOutfit.genreSlug);
    }
  }, [currentOutfit?.id, trackView]);

  // Flush engagement signals on unmount
  useEffect(() => {
    return () => flush();
  }, [flush]);

  // Check if user is new (no saved outfits and no wardrobe)
  useEffect(() => {
    const key = "ootd-welcomed";
    if (sessionStorage.getItem(key)) return;

    Promise.all([
      fetch("/api/wardrobe").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/outfits/saved").then((r) => r.json()).catch(() => ({ outfits: [] })),
    ]).then(([wardrobe, saved]) => {
      if (wardrobe.items?.length === 0 && saved.outfits?.length === 0) {
        setIsNewUser(true);
      }
    });
  }, []);

  // Fetch outfits when genre, occasion, or weather changes (debounced 300ms for rapid switching)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOutfits({ genre: activeGenre, occasion, weather: weatherParam });
    }, 300);
    return () => clearTimeout(timer);
  }, [activeGenre, occasion, weatherParam, fetchOutfits]);

  // Prefetch adjacent genres — pre-warms API cache for fast switching
  useEffect(() => {
    const idx = GENRES.findIndex((g) => g.slug === activeGenre);
    const prev = GENRES[(idx - 1 + GENRES.length) % GENRES.length];
    const next = GENRES[(idx + 1) % GENRES.length];
    const timer = setTimeout(() => {
      prefetch(prev.slug, occasion);
      prefetch(next.slug, occasion);
    }, 2000);
    return () => clearTimeout(timer);
  }, [activeGenre, occasion, prefetch]);

  return (
    <PageTransition>
    <main className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Your Outfits
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Swipe through AI-curated looks for your style
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pinterest"
            className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-neutral-400 transition hover:text-white hover:bg-white/10"
          >
            <Pin size={14} />
          </Link>
          <Link
            href="/rate-my-outfit"
            className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-neutral-400 transition hover:text-white hover:bg-white/10"
          >
            <Camera size={14} />
          </Link>
          <Link
            href="/discover"
            className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-neutral-400 transition hover:text-white hover:bg-white/10"
          >
            <Compass size={14} />
          </Link>
        </div>
      </div>

      {/* Welcome card for new users — guides them to personalize */}
      {isNewUser && !dismissedWelcome && (
        <div className="glass rounded-2xl p-5 mb-5 border border-brand-purple/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Make your outfits more personal
              </p>
            </div>
            <button
              onClick={() => {
                setDismissedWelcome(true);
                try { sessionStorage.setItem("ootd-welcomed", "1"); } catch {}
              }}
              className="text-neutral-500 hover:text-neutral-300 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/wardrobe"
              className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-neutral-300 transition hover:bg-white/10"
            >
              <Shirt size={16} className="text-brand-purple shrink-0" />
              <span>Upload your clothes</span>
            </Link>
            <Link
              href="/style-profile"
              className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs text-neutral-300 transition hover:bg-white/10"
            >
              <Palette size={16} className="text-brand-purple shrink-0" />
              <span>Body & color profile</span>
            </Link>
          </div>
        </div>
      )}

      {/* Weather banner — shows when location is available */}
      {weather && (
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 mb-5">
          <CloudSun size={20} className="text-brand-purple shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {weather.tempC}°C in {weather.city} — {weather.condition.toLowerCase()}
            </p>
            <p className="text-xs text-neutral-500">
              Outfits tuned for {weather.outfitWeather} weather
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <MapPin size={12} className="text-neutral-500" />
            <span className="text-[10px] text-neutral-500">Auto</span>
          </div>
        </div>
      )}

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
              cardIndex={currentIndex}
              onRate={(rating) => {
                // Track "save" engagement when user loves an outfit
                if (rating === "love") trackSave(currentOutfit.genreSlug);
                rateOutfit(rating);
              }}
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
    </PageTransition>
  );
}
