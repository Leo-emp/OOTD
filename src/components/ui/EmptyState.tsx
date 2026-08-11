"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Branded empty state — replaces plain text with animated SVG illustrations
// Each variant has a unique illustration matching the page context
type EmptyStateVariant = "wardrobe" | "saved" | "history" | "calendar" | "generic";

// Wardrobe empty state — floating hanger with garments
function WardrobeIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Hanger hook */}
      <motion.path
        d="M60 12 C60 6 66 2 72 6"
        stroke="url(#grad1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      {/* Hanger body */}
      <motion.path
        d="M32 44 L60 20 L88 44"
        stroke="url(#grad1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />
      {/* T-shirt outline */}
      <motion.path
        d="M38 44 L38 90 C38 92 40 94 42 94 L78 94 C80 94 82 92 82 90 L82 44"
        stroke="rgba(192,132,252,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="rgba(192,132,252,0.06)"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      />
      {/* Sleeve left */}
      <motion.path
        d="M38 44 L22 56 L22 62 L38 58"
        stroke="rgba(192,132,252,0.3)"
        strokeWidth="1.5"
        fill="rgba(192,132,252,0.04)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      />
      {/* Sleeve right */}
      <motion.path
        d="M82 44 L98 56 L98 62 L82 58"
        stroke="rgba(192,132,252,0.3)"
        strokeWidth="1.5"
        fill="rgba(192,132,252,0.04)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      />
      {/* Sparkle dots */}
      <motion.circle cx="20" cy="30" r="1.5" fill="rgba(255,107,157,0.6)"
        initial={{ scale: 0 }} animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.circle cx="100" cy="38" r="1" fill="rgba(96,165,250,0.6)"
        initial={{ scale: 0 }} animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
      />
      <motion.circle cx="50" cy="108" r="1.5" fill="rgba(192,132,252,0.5)"
        initial={{ scale: 0 }} animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
      />
      <defs>
        <linearGradient id="grad1" x1="32" y1="2" x2="88" y2="44">
          <stop stopColor="#FF6B9D" />
          <stop offset="0.5" stopColor="#C084FC" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Saved outfits empty state — heart with outfit grid
function SavedIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Heart outline */}
      <motion.path
        d="M60 100 C20 70 10 40 30 25 C45 14 58 24 60 32 C62 24 75 14 90 25 C110 40 100 70 60 100Z"
        stroke="url(#heartGrad)"
        strokeWidth="2"
        fill="rgba(255,107,157,0.06)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      {/* Mini outfit cards inside heart */}
      <motion.rect x="42" y="42" width="16" height="20" rx="3"
        fill="rgba(192,132,252,0.15)" stroke="rgba(192,132,252,0.3)" strokeWidth="1"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }}
      />
      <motion.rect x="62" y="42" width="16" height="20" rx="3"
        fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.3)" strokeWidth="1"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0 }}
      />
      <motion.rect x="52" y="66" width="16" height="20" rx="3"
        fill="rgba(255,107,157,0.15)" stroke="rgba(255,107,157,0.3)" strokeWidth="1"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}
      />
      {/* Sparkles */}
      <motion.circle cx="24" cy="50" r="1.5" fill="rgba(255,107,157,0.5)"
        animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx="96" cy="55" r="1" fill="rgba(192,132,252,0.5)"
        animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      />
      <defs>
        <linearGradient id="heartGrad" x1="10" y1="14" x2="110" y2="100">
          <stop stopColor="#FF6B9D" />
          <stop offset="1" stopColor="#C084FC" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Calendar empty state — calendar page with no events
function CalendarIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Calendar body */}
      <motion.rect x="20" y="28" width="80" height="76" rx="8"
        stroke="url(#calGrad)" strokeWidth="2" fill="rgba(192,132,252,0.04)"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />
      {/* Calendar top bar */}
      <motion.rect x="20" y="28" width="80" height="20" rx="8"
        fill="rgba(192,132,252,0.12)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />
      {/* Calendar hooks */}
      <motion.line x1="42" y1="20" x2="42" y2="36" stroke="rgba(192,132,252,0.5)" strokeWidth="2.5" strokeLinecap="round"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.4 }}
      />
      <motion.line x1="78" y1="20" x2="78" y2="36" stroke="rgba(192,132,252,0.5)" strokeWidth="2.5" strokeLinecap="round"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 }}
      />
      {/* Day dots */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <motion.circle
            key={`${row}-${col}`}
            cx={30 + col * 10} cy={58 + row * 10}
            r="2"
            fill="rgba(255,255,255,0.08)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + (row * 7 + col) * 0.02 }}
          />
        ))
      )}
      {/* Highlighted day */}
      <motion.circle cx="60" cy="78" r="4"
        fill="rgba(192,132,252,0.3)" stroke="rgba(192,132,252,0.6)" strokeWidth="1"
        initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
      <defs>
        <linearGradient id="calGrad" x1="20" y1="28" x2="100" y2="104">
          <stop stopColor="#C084FC" />
          <stop offset="1" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Props for the reusable empty state component
interface EmptyStateProps {
  variant: EmptyStateVariant;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

// Map variant to illustration component
const ILLUSTRATIONS: Record<EmptyStateVariant, () => React.ReactNode> = {
  wardrobe: WardrobeIllustration,
  saved: SavedIllustration,
  history: SavedIllustration,
  calendar: CalendarIllustration,
  generic: SavedIllustration,
};

export function EmptyState({ variant, title, description, actionLabel, actionHref }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-12 text-center flex flex-col items-center"
    >
      {/* Animated SVG illustration */}
      <div className="mb-5">
        <Illustration />
      </div>

      {/* Title */}
      <p className="text-neutral-200 font-heading text-lg font-semibold mb-2">
        {title}
      </p>

      {/* Description */}
      <p className="text-sm text-neutral-500 max-w-[260px] leading-relaxed">
        {description}
      </p>

      {/* Optional CTA button */}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-5 gradient-bg rounded-xl px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}
