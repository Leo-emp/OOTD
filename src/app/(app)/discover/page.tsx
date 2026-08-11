"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { GenreSelector } from "@/components/genre/GenreSelector";
import { GENRES } from "@/lib/constants";

// Catalog item shape from API
interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrls: string[];
  category: string;
  color: string;
  genreTags: string[];
  affiliateUrl: string;
}

interface CatalogFilters {
  brands: string[];
  priceRange: { min: number; max: number };
  categories: string[];
}

// Category icons — clean minimal pills
const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  top: "Tops",
  bottom: "Bottoms",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessories",
  bag: "Bags",
};

export default function DiscoverPage() {
  const [genre, setGenre] = useState("minimalist");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filters, setFilters] = useState<CatalogFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBrands, setShowBrands] = useState(false);

  // Fetch catalog items when genre/category/brand changes
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ genre, limit: "60" });
      if (category !== "all") params.set("category", category);
      if (brand) params.set("brand", brand);

      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setFilters(data.filters || null);
      }
    } catch {
      // Network error — keep existing items
    }
    setLoading(false);
  }, [genre, category, brand]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-heading text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-sm text-neutral-400 mb-5">
          Browse {items.length}+ curated fashion pieces
        </p>
      </motion.div>

      {/* Genre selector — horizontal scroll */}
      <div className="mb-4">
        <GenreSelector
          genres={GENRES}
          activeGenre={genre}
          onSelect={(g) => {
            setGenre(g);
            setBrand("");
          }}
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 mb-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === key
                ? "bg-white text-black"
                : "bg-white/5 text-neutral-400 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Brand filter — collapsible */}
      {filters && filters.brands.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowBrands(!showBrands)}
            className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors flex items-center gap-1"
          >
            <span>Brands</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className={`transition-transform ${showBrands ? "rotate-180" : ""}`}
            >
              <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            {brand && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-400/20 text-brand-400">
                {brand}
                <button
                  onClick={(e) => { e.stopPropagation(); setBrand(""); }}
                  className="ml-1"
                >
                  ×
                </button>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showBrands && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {filters.brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setBrand(brand === b ? "" : b); setShowBrands(false); }}
                      className={`px-3 py-1 rounded-full text-[11px] transition-all ${
                        brand === b
                          ? "bg-brand-400/20 text-brand-400"
                          : "bg-white/5 text-neutral-400 hover:bg-white/10"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-xl bg-white/5" />
              <div className="mt-2 h-3 w-3/4 rounded bg-white/5" />
              <div className="mt-1 h-3 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <p className="text-neutral-300 font-medium">No items found</p>
          <p className="text-sm text-neutral-500 mt-1">
            Try a different genre or clear filters
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, index) => (
            <motion.a
              key={item.id}
              href={item.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              className="group"
            >
              {/* Product image */}
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 relative">
                {item.imageUrls?.[0] ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt={`${item.brand} ${item.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">{item.brand}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{item.name}</p>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-3 py-1.5 rounded-full bg-white/90 text-black text-xs font-medium">
                    View
                  </span>
                </div>

                {/* Category badge */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-neutral-300 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              {/* Product info */}
              <div className="mt-2 px-0.5">
                <p className="text-xs font-semibold text-white truncate">{item.brand}</p>
                <p className="text-[11px] text-neutral-400 truncate">{item.name}</p>
                <p className="text-xs font-semibold text-brand-400 mt-0.5">${item.price}</p>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </main>
  );
}
