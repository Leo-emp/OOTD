"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GENRES, GENRE_COLORS } from "@/lib/constants";

// Style quiz — 5 questions that map to genre preferences
// Results feed into Style DNA (primary/secondary/accent genres)
const QUESTIONS = [
  {
    id: "vibe",
    question: "Pick the vibe that speaks to you most",
    options: [
      { label: "Quiet luxury", genre: "old-money" },
      { label: "Bold & expressive", genre: "streetwear" },
      { label: "Soft & romantic", genre: "cottagecore" },
      { label: "Clean & minimal", genre: "minimalist" },
    ],
  },
  {
    id: "weekend",
    question: "Your ideal weekend outfit includes",
    options: [
      { label: "Linen and loafers", genre: "coastal-grandma" },
      { label: "Graphic tee and sneakers", genre: "streetwear" },
      { label: "Maxi dress and sandals", genre: "indie-boho" },
      { label: "Matching set and gold hoops", genre: "clean-girl" },
    ],
  },
  {
    id: "color",
    question: "Your wardrobe is mostly",
    options: [
      { label: "Neutrals and earth tones", genre: "old-money" },
      { label: "Black and dark colors", genre: "grunge" },
      { label: "Pastels and pinks", genre: "coquette" },
      { label: "Bold colors and metallics", genre: "y2k" },
    ],
  },
  {
    id: "shoes",
    question: "Reach for these shoes first",
    options: [
      { label: "Clean sneakers", genre: "clean-girl" },
      { label: "Combat boots", genre: "grunge" },
      { label: "Trail runners", genre: "gorpcore" },
      { label: "Ballet flats", genre: "coquette" },
    ],
  },
  {
    id: "brand",
    question: "Which brand resonates most",
    options: [
      { label: "COS or Arket", genre: "minimalist" },
      { label: "Free People", genre: "indie-boho" },
      { label: "Arc'teryx", genre: "gorpcore" },
      { label: "Ralph Lauren", genre: "dark-academia" },
    ],
  },
];

// Genre display names — derived from shared GENRES constant
const GENRE_NAMES: Record<string, string> = Object.fromEntries(
  GENRES.map((g) => [g.slug, g.name])
);

interface StyleDna {
  primaryGenre: string;
  secondaryGenre?: string;
  accentGenre?: string;
  breakdown: Array<{ genre: string; percentage: number }>;
}

export default function QuizPage() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [styleDna, setStyleDna] = useState<StyleDna | null>(null);

  async function selectAnswer(genre: string) {
    const question = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [question.id]: genre };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Quiz complete — analyze with AI
      setAnalyzing(true);
      try {
        const res = await fetch("/api/quiz/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: newAnswers }),
        });
        if (res.ok) {
          const data = await res.json();
          setStyleDna(data.styleDna);
        } else {
          // Fallback — calculate locally
          const genreCounts: Record<string, number> = {};
          Object.values(newAnswers).forEach((g) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
          const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
          setStyleDna({
            primaryGenre: sorted[0]?.[0] || "minimalist",
            secondaryGenre: sorted[1]?.[0],
            accentGenre: sorted[2]?.[0],
            breakdown: sorted.map(([genre, count]) => ({
              genre,
              percentage: Math.round((count / Object.keys(newAnswers).length) * 100),
            })),
          });
        }
      } catch {
        // Network error — redirect to dashboard with default genre
        router.push("/dashboard");
      }
      setAnalyzing(false);
    }
  }

  // Show Style DNA results
  if (styleDna) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Style DNA card */}
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Your Style DNA</p>
            <h2 className="font-heading text-3xl font-bold text-white mb-1">
              {GENRE_NAMES[styleDna.primaryGenre] || styleDna.primaryGenre}
            </h2>
            {styleDna.secondaryGenre && (
              <p className="text-sm text-neutral-400">
                with hints of{" "}
                <span className="text-neutral-300">
                  {GENRE_NAMES[styleDna.secondaryGenre]}
                </span>
                {styleDna.accentGenre && (
                  <>
                    {" "}and{" "}
                    <span className="text-neutral-300">
                      {GENRE_NAMES[styleDna.accentGenre]}
                    </span>
                  </>
                )}
              </p>
            )}

            {/* Genre breakdown bars */}
            <div className="mt-6 space-y-2">
              {styleDna.breakdown.map((item, index) => (
                <motion.div
                  key={item.genre}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-neutral-400 w-24 text-right truncate">
                    {GENRE_NAMES[item.genre] || item.genre}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: GENRE_COLORS[item.genre] || "#A0A0A0" }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 w-8">{item.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Post-quiz actions — onboarding flow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {/* Primary CTA — personalize further */}
            <button
              onClick={() => router.push("/style-profile")}
              className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold shadow-lg shadow-brand-400/20 cursor-pointer"
            >
              Set Up Body & Color Profile
            </button>

            {/* Secondary CTA — skip to outfits */}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-neutral-300 transition hover:bg-white/10 cursor-pointer"
            >
              Skip — Show Me Outfits
            </button>

            <p className="text-xs text-neutral-500 text-center">
              Body & color profiles make outfit recommendations more accurate
            </p>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  // Show loading state while analyzing
  if (analyzing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-brand-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-300 font-medium">Analyzing your style...</p>
          <p className="text-sm text-neutral-500 mt-1">Building your Style DNA</p>
        </motion.div>
      </main>
    );
  }

  // Show quiz questions
  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-1 w-full rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full gradient-bg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">
          {currentQ + 1} of {QUESTIONS.length}
        </p>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="w-full max-w-md space-y-6"
        >
          <h2 className="font-heading text-2xl font-bold text-white text-center">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAnswer(option.genre)}
                className="glass w-full rounded-xl px-6 py-4 text-left text-white transition hover:bg-white/10 cursor-pointer"
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
