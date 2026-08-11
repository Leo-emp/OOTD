"use client";

// ── Rate My Outfit ──
// Upload an outfit photo → AI rates it against a style genre → shareable score card
// The score card is the viral hook — users share their scores to flex or compete

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Camera, Upload, Star, ArrowLeft, Sparkles, CheckCircle, AlertTriangle, Share2, Download, Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRES } from "@/lib/constants";
import { generateScoreCard, downloadImage, shareCard } from "@/lib/share-card";

interface RatingResult {
  score: number;
  feedback: string;
  improvements: string[];
  genreAlignment: number;
}

export default function RateMyOutfitPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedGenre, setSelectedGenre] = useState("old-money");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rating, setRating] = useState<RatingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "shared" | "downloaded">("idle");

  // Handle image selection — show preview
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setRating(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // Submit outfit for AI rating
  async function handleRate() {
    if (!imageFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("genre", selectedGenre);

      const res = await fetch("/api/outfits/rate-photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Rating failed");

      const data: RatingResult = await res.json();
      setRating(data);
      toast(data.score >= 7 ? "Great outfit!" : "Room for improvement!", data.score >= 7 ? "success" : "info");
    } catch {
      toast("Failed to rate outfit. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Download the score card as PNG
  function handleDownloadCard() {
    if (!rating) return;
    const dataUrl = generateScoreCard({
      score: rating.score,
      genre: selectedGenre,
      genreAlignment: rating.genreAlignment,
      feedback: rating.feedback,
    });
    downloadImage(dataUrl, `ootd-score-${rating.score}-${selectedGenre}.png`);
    setShareState("downloaded");
    setTimeout(() => setShareState("idle"), 2000);
  }

  // Share the score card via Web Share API
  async function handleShareCard() {
    if (!rating) return;
    const genreName = GENRES.find(g => g.slug === selectedGenre)?.name || selectedGenre;
    const dataUrl = generateScoreCard({
      score: rating.score,
      genre: selectedGenre,
      genreAlignment: rating.genreAlignment,
      feedback: rating.feedback,
    });
    const shared = await shareCard({
      title: `I scored ${rating.score}/10!`,
      text: `My ${genreName} outfit got a ${rating.score}/10 on OOTD AI! Think you can beat it?`,
      imageDataUrl: dataUrl,
    });
    if (shared) {
      setShareState("shared");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }

  // Score color — green for high, yellow for medium, red for low
  function scoreColor(score: number) {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  }

  // Score ring color — gradient arc behind the score number
  function ringGradient(score: number) {
    if (score >= 8) return "from-green-400 to-emerald-500";
    if (score >= 5) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-rose-500";
  }

  return (
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
          <h1 className="font-heading text-xl font-bold text-white">Rate My Outfit</h1>
          <p className="text-xs text-neutral-500">Get AI feedback on your look</p>
        </div>
      </div>

      {/* Genre selector */}
      <div className="mb-5">
        <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Rate against</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.slug}
              onClick={() => { setSelectedGenre(g.slug); setRating(null); }}
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

      {/* Image upload area */}
      <div className="mb-6">
        {imagePreview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="aspect-[3/4] relative">
              <Image
                src={imagePreview}
                alt="Your outfit"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Change photo button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-2 text-xs text-white transition hover:bg-black/80 cursor-pointer"
            >
              <Camera size={14} />
              Change
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Upload outfit photo for rating"
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-brand-purple/30 hover:text-brand-purple transition cursor-pointer"
          >
            <Upload size={32} />
            <div className="text-center">
              <p className="text-sm font-medium">Upload your outfit photo</p>
              <p className="text-xs text-neutral-500 mt-1">Full-body mirror shots work best</p>
            </div>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Rate button */}
      {imagePreview && !rating && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRate}
          disabled={loading}
          className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mb-6"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Analyzing your outfit...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Rate My Outfit
            </>
          )}
        </motion.button>
      )}

      {/* Rating results */}
      <AnimatePresence>
        {rating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Score circle */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="relative inline-flex items-center justify-center mb-3">
                {/* Ring behind score */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringGradient(rating.score)} opacity-20 blur-sm`} />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/10 bg-white/5">
                  <span className={`font-heading text-4xl font-bold ${scoreColor(rating.score)}`}>
                    {rating.score}
                  </span>
                  <span className="absolute bottom-2 text-[10px] text-neutral-500">/10</span>
                </div>
              </div>
              <p className="text-sm text-neutral-300">{rating.feedback}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Star size={12} className="text-brand-purple" />
                <span className="text-xs text-neutral-400">
                  {rating.genreAlignment}% {selectedGenre.replace(/-/g, " ")} alignment
                </span>
              </div>
            </div>

            {/* Improvements */}
            {rating.improvements.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  How to improve
                </h3>
                <ul className="space-y-2.5">
                  {rating.improvements.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-300">
                      <CheckCircle size={14} className="text-brand-purple shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Share + Download score card — the viral sharing buttons */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-brand-pink" />
                Share your score
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                Challenge your friends — can they beat your {rating.score}/10?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleShareCard}
                  className="flex-1 flex items-center justify-center gap-2 gradient-bg rounded-xl py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    {shareState === "shared" ? (
                      <motion.span key="shared" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                        <Check size={14} /> Shared!
                      </motion.span>
                    ) : (
                      <motion.span key="share" className="flex items-center gap-1.5">
                        <Share2 size={14} /> Share Score Card
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={handleDownloadCard}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-white/5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    {shareState === "downloaded" ? (
                      <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                        <Check size={14} /> Saved!
                      </motion.span>
                    ) : (
                      <motion.span key="dl" className="flex items-center gap-1.5">
                        <Download size={14} /> Save
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Try again button */}
            <button
              onClick={() => { setRating(null); setImagePreview(null); setImageFile(null); setShareState("idle"); }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Rate another outfit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
