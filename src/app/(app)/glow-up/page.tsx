"use client";

// ── Before/After Glow-Up Page ──
// Upload a mirror selfie → AI analyzes and suggests upgrades
// Shows a side-by-side before/after with improvement tips
// Shareable transformation cards for social media virality

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Upload, ArrowRight, Sparkles, Share2, RotateCcw, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRES } from "@/lib/constants";
import { shareCard } from "@/lib/share-card";
import { PageTransition } from "@/components/ui/PageTransition";

// AI glow-up response shape
interface GlowUpResult {
  currentScore: number;
  potentialScore: number;
  improvements: {
    category: string;
    suggestion: string;
    impact: "high" | "medium" | "low";
  }[];
  overallFeedback: string;
  styleDirection: string;
}

export default function GlowUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedGenre, setSelectedGenre] = useState("minimalist");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<GlowUpResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "slider">("split");

  // Handle image upload
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // Submit for AI analysis
  async function handleAnalyze() {
    if (!imageFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("genre", selectedGenre);

      const res = await fetch("/api/outfits/glow-up", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data: GlowUpResult = await res.json();
      setResult(data);
      toast("Glow-up analysis complete!", "success");
    } catch {
      toast("Failed to analyze. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Share the glow-up result
  async function handleShare() {
    if (!result) return;
    const shared = await shareCard({
      title: "My Style Glow-Up",
      text: `${result.currentScore}/10 → ${result.potentialScore}/10 glow-up potential! Get your style analysis on OOTD AI`,
    });
    if (shared) toast("Shared!", "success");
  }

  // Impact badge color for improvement priority
  function impactColor(impact: string) {
    if (impact === "high") return "bg-red-400/10 text-red-400";
    if (impact === "medium") return "bg-yellow-400/10 text-yellow-400";
    return "bg-green-400/10 text-green-400";
  }

  // Reset for another upload
  function handleReset() {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">Style Glow-Up</h1>
            <p className="text-xs text-neutral-500">See your outfit transformation potential</p>
          </div>
        </div>

        {/* Genre selector */}
        <div className="mb-5">
          <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Target style</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.slug}
                onClick={() => { setSelectedGenre(g.slug); setResult(null); }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedGenre === g.slug
                    ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                    : "glass text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        {!imagePreview ? (
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Upload outfit photo for glow-up analysis"
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-brand-purple/30 hover:text-brand-purple transition cursor-pointer"
          >
            <Upload size={32} />
            <div className="text-center">
              <p className="text-sm font-medium">Upload your current outfit</p>
              <p className="text-xs text-neutral-500 mt-1">Full-body mirror selfie works best</p>
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Before/After display */}
            {result ? (
              <>
                {/* Score transformation — the hero moment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {/* Current score */}
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Now</p>
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400/30 bg-yellow-400/5">
                        <span className="font-heading text-3xl font-bold text-yellow-400">{result.currentScore}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ArrowRight size={24} className="text-brand-purple" />
                    </motion.div>

                    {/* Potential score */}
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Potential</p>
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-400/30 bg-green-400/5">
                        <span className="font-heading text-3xl font-bold text-green-400">{result.potentialScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score increase badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-semibold">
                      <Sparkles size={12} />
                      +{result.potentialScore - result.currentScore} point glow-up potential
                    </span>
                  </div>
                </motion.div>

                {/* Before photo with improvements overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl overflow-hidden relative"
                >
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={imagePreview}
                      alt="Your current outfit"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* "BEFORE" label */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-white">
                      YOUR LOOK
                    </div>
                  </div>
                </motion.div>

                {/* Style direction */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass rounded-2xl p-5"
                >
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <ChevronRight size={14} className="text-brand-purple" />
                    Style Direction
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">{result.styleDirection}</p>
                </motion.div>

                {/* Improvements list */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass rounded-2xl p-5"
                >
                  <h3 className="text-sm font-semibold text-white mb-3">Glow-Up Moves</h3>
                  <div className="space-y-3">
                    {result.improvements.map((imp, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 mt-0.5 ${impactColor(imp.impact)}`}>
                          {imp.impact}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white">{imp.category}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{imp.suggestion}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Overall feedback */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-2xl p-5"
                >
                  <p className="text-sm text-neutral-300 leading-relaxed italic">
                    "{result.overallFeedback}"
                  </p>
                </motion.div>

                {/* Action buttons — share + try again */}
                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 gradient-bg rounded-xl py-3 text-sm font-semibold text-white cursor-pointer"
                  >
                    <Share2 size={16} />
                    Share Glow-Up
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    New
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Photo preview before analysis */}
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={imagePreview}
                      alt="Your outfit"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-2 text-xs text-white transition hover:bg-black/80 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Analyze button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Analyzing your fit...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Get My Glow-Up
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
      </main>
    </PageTransition>
  );
}
