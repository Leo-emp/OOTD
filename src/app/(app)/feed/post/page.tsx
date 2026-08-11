"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Image as ImageIcon, Send } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRES, GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Saved outfit for selection
interface SavedOutfit {
  id: string;
  genreSlug: string;
  items: { imageUrl: string }[];
}

export default function CreatePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("old-money");
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved outfits for "share from saved" option
  useEffect(() => {
    fetch("/api/outfits/saved")
      .then((r) => r.json())
      .then((data) => {
        if (data.outfits) setSavedOutfits(data.outfits.slice(0, 12));
      })
      .catch(() => {});
  }, []);

  // Handle file upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to blob via wardrobe upload endpoint (reuse infrastructure)
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/wardrobe/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } else {
        toast("Upload failed", "error");
        setImagePreview(null);
      }
    } catch {
      toast("Upload failed", "error");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  // Select from saved outfit
  function handleSelectSaved(outfit: SavedOutfit) {
    const img = outfit.items?.[0]?.imageUrl;
    if (!img) return;
    setImagePreview(img);
    setImageUrl(img);
    setSelectedGenre(outfit.genreSlug);
    setShowSaved(false);
  }

  // Submit post
  async function handlePost() {
    if (!imageUrl) {
      toast("Please add a photo first", "error");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          caption: caption.trim() || undefined,
          genreSlug: selectedGenre,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to post", "error");
        return;
      }

      toast("Posted to the community!", "success");
      router.push("/feed");
    } catch {
      toast("Failed to post", "error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-heading text-xl font-bold text-white">Share Your Look</h1>
          </div>
          <button
            onClick={handlePost}
            disabled={!imageUrl || posting || uploading}
            className="flex items-center gap-1.5 gradient-bg rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
          >
            {posting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Send size={14} />
            )}
            Post
          </button>
        </div>

        {/* Image area */}
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden mb-5">
            <div className="aspect-[3/4] relative">
              <Image
                src={imagePreview}
                alt="Your outfit"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
              </div>
            )}
            <button
              onClick={() => { setImagePreview(null); setImageUrl(null); }}
              className="absolute top-3 right-3 glass rounded-full px-3 py-1.5 text-xs text-white cursor-pointer"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            {/* Upload photo */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-brand-purple/30 hover:text-brand-purple transition cursor-pointer"
            >
              <Upload size={32} />
              <div className="text-center">
                <p className="text-sm font-medium">Upload your OOTD</p>
                <p className="text-xs text-neutral-500 mt-1">Full-body mirror shots work best</p>
              </div>
            </button>

            {/* Or pick from saved */}
            {savedOutfits.length > 0 && (
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-300 hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ImageIcon size={14} />
                Share from saved outfits
              </button>
            )}

            {/* Saved outfits grid */}
            {showSaved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-3 gap-2 overflow-hidden"
              >
                {savedOutfits.map((outfit) => (
                  <button
                    key={outfit.id}
                    onClick={() => handleSelectSaved(outfit)}
                    className="aspect-square relative rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-purple transition"
                  >
                    <Image
                      src={outfit.items?.[0]?.imageUrl || ""}
                      alt="Saved outfit"
                      fill
                      sizes="33vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Caption */}
        <div className="mb-5">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 500))}
            placeholder="Describe your look..."
            rows={3}
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 resize-none focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
          />
          <p className="text-[10px] text-neutral-600 text-right mt-1">{caption.length}/500</p>
        </div>

        {/* Genre tag */}
        <div>
          <p className="text-xs text-neutral-400 mb-2 uppercase tracking-wider">Genre tag</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.slug}
                onClick={() => setSelectedGenre(g.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedGenre === g.slug
                    ? "text-white border"
                    : "glass text-neutral-400 hover:text-neutral-200"
                }`}
                style={
                  selectedGenre === g.slug
                    ? {
                        backgroundColor: `${GENRE_COLORS[g.slug]}20`,
                        borderColor: `${GENRE_COLORS[g.slug]}50`,
                        color: GENRE_COLORS[g.slug],
                      }
                    : undefined
                }
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
