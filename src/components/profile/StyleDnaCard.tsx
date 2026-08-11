"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Check, Sparkles } from "lucide-react";
import { generateStyleDnaCard, downloadImage, shareCard } from "@/lib/share-card";
import { useSession } from "@/lib/auth/client";

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

// Fun personality titles per genre — shown on the shareable card
const GENRE_TITLES: Record<string, string> = {
  "old-money": "The Quiet Luxury Icon",
  "y2k": "The Nostalgia Queen",
  "streetwear": "The Drip Architect",
  "minimalist": "The Essentialist",
  "cottagecore": "The Countryside Dreamer",
  "dark-academia": "The Literary Romantic",
  "coastal-grandma": "The Seaside Sophisticate",
  "grunge": "The Anti-Fashion Rebel",
  "coquette": "The Soft-Glam Princess",
  "gorpcore": "The Trail-Chic Explorer",
  "clean-girl": "The Effortless Beauty",
  "indie-boho": "The Free Spirit",
};

interface StyleDnaProps {
  primaryGenre: string;
  secondaryGenre?: string | null;
  accentGenre?: string | null;
  breakdown?: { genre: string; percentage: number }[];
  compact?: boolean;
}

// Style DNA card — shows the user's genre breakdown with animated bars
// Now includes share/download buttons for viral sharing (Spotify Wrapped playbook)
export function StyleDnaCard({ primaryGenre, secondaryGenre, accentGenre, breakdown, compact }: StyleDnaProps) {
  const { data: session } = useSession();
  const [shareState, setShareState] = useState<"idle" | "shared" | "downloaded">("idle");

  const primary = GENRE_DISPLAY[primaryGenre] || { name: primaryGenre, color: "#C084FC" };
  const secondary = secondaryGenre ? GENRE_DISPLAY[secondaryGenre] : null;
  const accent = accentGenre ? GENRE_DISPLAY[accentGenre] : null;
  const personalityTitle = GENRE_TITLES[primaryGenre] || "Style Chameleon";

  // Build breakdown from genres if not provided
  const bars = breakdown || [
    { genre: primaryGenre, percentage: 60 },
    ...(secondaryGenre ? [{ genre: secondaryGenre, percentage: 25 }] : []),
    ...(accentGenre ? [{ genre: accentGenre, percentage: 15 }] : []),
  ];

  // Generate and download the share card as a PNG image
  function handleDownload() {
    const dataUrl = generateStyleDnaCard({
      name: session?.user?.name || "Fashionista",
      primaryGenre,
      secondaryGenre,
      accentGenre,
      breakdown: bars,
    });
    downloadImage(dataUrl, `ootd-style-dna-${primaryGenre}.png`);
    setShareState("downloaded");
    setTimeout(() => setShareState("idle"), 2000);
  }

  // Share the card via Web Share API or clipboard
  async function handleShare() {
    const dataUrl = generateStyleDnaCard({
      name: session?.user?.name || "Fashionista",
      primaryGenre,
      secondaryGenre,
      accentGenre,
      breakdown: bars,
    });
    const shared = await shareCard({
      title: `My Style DNA — ${primary.name}`,
      text: `I'm ${bars[0]?.percentage || 60}% ${primary.name}! What's your style DNA?`,
      imageDataUrl: dataUrl,
    });
    if (shared) {
      setShareState("shared");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }

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

      {/* Header — DNA label + personality title */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: `${primary.color}20`, color: primary.color }}
        >
          DNA
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-white text-sm">
            {compact ? "Style DNA" : "Your Style DNA"}
          </h3>
          <p className="text-xs text-neutral-400">{primary.name} dominant</p>
        </div>
      </div>

      {/* Personality title — fun shareable tagline */}
      {!compact && (
        <div
          className="rounded-xl px-4 py-2.5 mb-4 text-center"
          style={{ backgroundColor: `${primary.color}10` }}
        >
          <p className="font-heading text-sm font-semibold" style={{ color: primary.color }}>
            {personalityTitle}
          </p>
        </div>
      )}

      {/* Genre breakdown bars */}
      <div className="space-y-3">
        {bars.map((item, i) => {
          const genre = GENRE_DISPLAY[item.genre] || { name: item.genre, color: "#C084FC" };
          return (
            <div key={item.genre}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-neutral-300">{genre.name}</span>
                <span className="text-xs font-bold" style={{ color: genre.color }}>{item.percentage}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
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

      {/* Share + Download buttons — the viral sharing mechanism */}
      {!compact && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer"
            style={{ backgroundColor: `${primary.color}15`, color: primary.color }}
          >
            <AnimatePresence mode="wait">
              {shareState === "shared" ? (
                <motion.span key="shared" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Check size={14} /> Shared!
                </motion.span>
              ) : (
                <motion.span key="share" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Share2 size={14} /> Share My DNA
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white/5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {shareState === "downloaded" ? (
                <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Check size={14} /> Saved!
                </motion.span>
              ) : (
                <motion.span key="dl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Download size={14} /> Save
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}
    </motion.div>
  );
}
