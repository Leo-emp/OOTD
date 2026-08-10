"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// Style quiz questions — each maps to genre preferences
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

export default function QuizPage() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function selectAnswer(genre: string) {
    const question = QUESTIONS[currentQ];
    const newAnswers = { ...answers, [question.id]: genre };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Quiz complete — calculate top genre and redirect
      const genreCounts: Record<string, number> = {};
      Object.values(newAnswers).forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
      const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "minimalist";

      // TODO: call /api/quiz/analyze with answers for AI-powered analysis
      router.push("/dashboard");
    }
  }

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
