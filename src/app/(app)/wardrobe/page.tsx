"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

interface WardrobeItem {
  id: string;
  imageUrl: string;
  imageThumbUrl: string | null;
  category: string | null;
  color: string | null;
  status: "processing" | "ready" | "rejected";
}

interface GapData {
  genre: string;
  totalItems: number;
  completeness: number;
  isOutfitReady: boolean;
  gaps: { category: string; priority: "essential" | "optional"; suggestion: string }[];
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [activeGenre, setActiveGenre] = useState("old-money");

  // Fetch wardrobe items
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/wardrobe");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // Silent fail — items stay empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch gap analysis when genre changes or items update
  useEffect(() => {
    if (items.length === 0) {
      setGapData(null);
      return;
    }
    fetch(`/api/wardrobe/gaps?genre=${activeGenre}`)
      .then((r) => r.json())
      .then((data) => setGapData(data))
      .catch(() => {});
  }, [activeGenre, items.length]);

  // Handle file upload
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/wardrobe/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setItems((prev) => [
          { id: data.id, imageUrl: data.imageUrl, imageThumbUrl: null, category: null, color: null, status: "processing" },
          ...prev,
        ]);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
    }
  }

  // Handle delete
  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
  }

  return (
    <main className="px-4 pt-6 pb-24">
      {/* Header + upload button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            My Wardrobe
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {items.length} items
          </p>
        </div>
        <label className="flex h-10 items-center gap-2 rounded-xl gradient-bg px-4 text-sm font-medium text-white transition hover:opacity-90 cursor-pointer">
          <Plus size={16} />
          {uploading ? "Uploading..." : "Add Item"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Gap analysis card — only shows when user has items */}
      {gapData && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 mb-6"
        >
          {/* Genre selector mini */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Wardrobe Gaps</h3>
            <select
              value={activeGenre}
              onChange={(e) => setActiveGenre(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-neutral-300 focus:outline-none focus:border-brand-purple"
            >
              {["old-money", "streetwear", "minimalist", "y2k", "dark-academia", "grunge", "cottagecore", "coastal-grandma", "coquette", "gorpcore", "clean-girl", "indie-boho"].map((g) => (
                <option key={g} value={g} className="bg-neutral-900">{g.replace(/-/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Completeness bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-400">
                {gapData.isOutfitReady ? "Outfit ready" : "Missing essentials"}
              </span>
              <span className="text-xs font-medium text-white">{gapData.completeness}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${gapData.completeness >= 70 ? "bg-green-500" : gapData.completeness >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${gapData.completeness}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Gap items */}
          {gapData.gaps.length > 0 ? (
            <div className="space-y-2">
              {gapData.gaps.slice(0, 3).map((gap) => (
                <div key={gap.category} className="flex items-start gap-3 text-xs">
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${gap.priority === "essential" ? "bg-red-400" : "bg-neutral-500"}`} />
                  <div>
                    <span className="font-medium text-neutral-200 capitalize">{gap.category}</span>
                    <p className="text-neutral-500 mt-0.5">{gap.suggestion}</p>
                  </div>
                </div>
              ))}
              {gapData.gaps.length > 0 && (
                <Link
                  href={`/discover?genre=${activeGenre}`}
                  className="block text-center text-xs text-brand-purple hover:underline mt-2 pt-2 border-t border-white/5"
                >
                  Shop missing pieces →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-xs text-green-400">Your {activeGenre.replace(/-/g, " ")} wardrobe is complete!</p>
          )}
        </motion.div>
      )}

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      )}

      {/* Wardrobe grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5"
              >
                <Image
                  src={item.imageThumbUrl || item.imageUrl}
                  alt={item.category || "Wardrobe item"}
                  fill
                  sizes="(max-width: 768px) 33vw, 150px"
                  className="object-cover"
                />
                {/* Processing overlay */}
                {item.status === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-brand-purple" />
                  </div>
                )}
                {/* Rejected overlay */}
                {item.status === "rejected" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-xs text-red-400 font-medium px-2 text-center">Not a clothing item</span>
                  </div>
                )}
                {/* Delete button on hover */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/60 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  aria-label="Delete item"
                >
                  <Trash2 size={14} />
                </button>
                {/* Category badge */}
                {item.category && (
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 capitalize">
                    {item.category}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-neutral-300 font-medium mb-2">
            Your wardrobe is empty
          </p>
          <p className="text-sm text-neutral-500">
            Upload photos of your clothes and our AI will categorize them for outfit recommendations
          </p>
        </div>
      )}
    </main>
  );
}
