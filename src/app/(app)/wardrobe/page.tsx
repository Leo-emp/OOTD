"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface WardrobeItem {
  id: string;
  imageUrl: string;
  imageThumbUrl: string | null;
  category: string | null;
  color: string | null;
  status: "processing" | "ready" | "rejected";
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        // Optimistic UI — add item immediately in processing state
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
    <main className="px-4 pt-6">
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

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      )}

      {/* Wardrobe grid */}
      {!loading && (
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
