"use client";

import { motion } from "framer-motion";

// Per-component skeleton shapes — content-aware shimmer loading placeholders
// Instead of generic rectangles, each skeleton matches the shape of what it loads

// Outfit card skeleton — matches hero items grid + text areas
export function OutfitCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-5 max-w-lg mx-auto">
      {/* Title area */}
      <div className="space-y-2">
        <div className="h-5 w-48 rounded-lg shimmer" />
        <div className="h-3 w-32 rounded-md shimmer" />
      </div>

      {/* Hero items — 2-column grid matching the 3:4 aspect */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="aspect-[3/4] rounded-xl shimmer"
          />
        ))}
      </div>

      {/* Bottom items — 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="aspect-[3/4] rounded-xl shimmer"
          />
        ))}
      </div>

      {/* Style explanation text lines */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-md shimmer" />
        <div className="h-3 w-3/4 rounded-md shimmer" />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-10 rounded-full shimmer" />
        ))}
      </div>
    </div>
  );
}

// Wardrobe grid skeleton — 3x3 grid of clothing photos
export function WardrobeGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          className="aspect-[3/4] rounded-xl shimmer"
        >
          {/* Category badge placeholder at bottom */}
          <div className="relative h-full">
            <div className="absolute bottom-2 left-2 h-4 w-12 rounded-full shimmer" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Saved outfit list skeleton — horizontal thumbnails + text
export function SavedListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-4"
        >
          {/* Item thumbnails row */}
          <div className="flex gap-2 mb-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="w-20 h-28 rounded-lg shrink-0 shimmer" />
            ))}
          </div>
          {/* Text lines */}
          <div className="space-y-2">
            <div className="h-4 w-48 rounded-md shimmer" />
            <div className="h-3 w-32 rounded-md shimmer" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Profile stats skeleton — circular avatar + stat cards
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar circle */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-full shimmer" />
        <div className="h-5 w-32 rounded-md shimmer" />
        <div className="h-3 w-24 rounded-md shimmer" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="h-8 w-12 rounded-md shimmer mb-2" />
            <div className="h-3 w-20 rounded-md shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
