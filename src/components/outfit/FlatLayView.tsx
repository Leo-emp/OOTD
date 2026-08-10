"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Grid3X3, Download, Share2 } from "lucide-react";
import type { OutfitItem } from "@/types/outfit";

// Flat-lay composite view — renders outfit items as a single editorial image
// Fetches the composite from /api/outfits/flatlay on demand (not on mount)
// Shows a toggle to switch between flat-lay and grid view
interface FlatLayViewProps {
  items: OutfitItem[];
  genreSlug: string;
  // Whether flat-lay is the initial view (defaults to grid)
  defaultView?: "flatlay" | "grid";
  // Render the grid view (passed as children or render prop)
  renderGrid: () => React.ReactNode;
}

export function FlatLayView({
  items,
  genreSlug,
  defaultView = "grid",
  renderGrid,
}: FlatLayViewProps) {
  const [view, setView] = useState<"flatlay" | "grid">(defaultView);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Generate the flat-lay composite when user switches to flat-lay view
  const generateFlatLay = useCallback(async () => {
    if (imageUrl || loading) return;
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/outfits/flatlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            imageUrl: i.imageUrl,
            position: i.position,
          })),
          genreSlug,
          format: "webp",
          aspect: "portrait",
        }),
      });

      if (!res.ok) throw new Error("Failed");

      // Convert the image response to a blob URL for display
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [items, genreSlug, imageUrl, loading]);

  // Trigger generation when switching to flat-lay view
  useEffect(() => {
    if (view === "flatlay") {
      generateFlatLay();
    }
  }, [view, generateFlatLay]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Download the flat-lay image
  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `outfit-${genreSlug}-flatlay.webp`;
    a.click();
  }

  // Share via Web Share API (mobile)
  async function handleShare() {
    if (!imageUrl) return;
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const file = new File([blob], `outfit-${genreSlug}.webp`, { type: "image/webp" });
      await navigator.share({ files: [file], title: "My OOTD AI Outfit" });
    } catch {
      // Share cancelled or not supported — fall back to download
      handleDownload();
    }
  }

  return (
    <div>
      {/* View toggle — sleek pill switch */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              view === "grid"
                ? "bg-white/10 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Grid3X3 size={14} />
            Items
          </button>
          <button
            onClick={() => setView("flatlay")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              view === "flatlay"
                ? "bg-white/10 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Layers size={14} />
            Flat Lay
          </button>
        </div>

        {/* Action buttons — only show when flat-lay is loaded */}
        <AnimatePresence>
          {view === "flatlay" && imageUrl && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex gap-1.5"
            >
              <button
                onClick={handleDownload}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Download flat-lay"
              >
                <Download size={14} />
              </button>
              <button
                onClick={handleShare}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Share flat-lay"
              >
                <Share2 size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content area — animated switch between views */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderGrid()}
          </motion.div>
        ) : (
          <motion.div
            key="flatlay"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Flat-lay image display */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white/5">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-brand-purple" />
                  <p className="text-xs text-neutral-500">Composing your flat-lay...</p>
                </div>
              )}

              {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <p className="text-xs text-neutral-400 text-center">
                    Couldn&apos;t generate flat-lay view
                  </p>
                  <button
                    onClick={() => { setError(false); setImageUrl(null); generateFlatLay(); }}
                    className="text-xs text-brand-purple hover:underline cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              )}

              {imageUrl && !loading && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  src={imageUrl}
                  alt="Outfit flat-lay composite"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
