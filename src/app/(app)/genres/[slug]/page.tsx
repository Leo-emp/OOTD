"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GENRE_COLORS } from "@/lib/constants";

interface GenreData {
  name: string;
  slug: string;
  description: string;
  colorRules: { palette: string[] };
  fitRules: { silhouette: string };
  mustHave: string[];
  forbidden: string[];
  referenceBrands: string[];
  priceRange: { min: number; max: number };
}

interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrls: string[];
  category: string;
  affiliateUrl: string;
}

export default function GenreExplorerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [genre, setGenre] = useState<GenreData | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const accentColor = GENRE_COLORS[slug] || "#C084FC";

  useEffect(() => {
    async function load() {
      // Fetch genre data + catalog items in parallel
      const [genreRes, catalogRes] = await Promise.all([
        fetch(`/api/genres/${slug}`),
        fetch(`/api/catalog?genre=${slug}&limit=12`),
      ]);

      if (genreRes.ok) {
        const data = await genreRes.json();
        setGenre(data.genre);
      }
      if (catalogRes.ok) {
        const data = await catalogRes.json();
        setItems(data.items || []);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <main className="px-4 pt-6 pb-24">
        <div className="h-8 w-48 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-4 w-64 rounded bg-white/5 animate-pulse mb-8" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (!genre) {
    return (
      <main className="px-4 pt-6 pb-24 text-center">
        <p className="text-neutral-400">Genre not found</p>
        <Link href="/discover" className="text-brand-purple text-sm mt-2 inline-block">Back to Discover</Link>
      </main>
    );
  }

  return (
    <main className="pb-24">
      {/* Hero section with gradient accent */}
      <div className="relative px-4 pt-6 pb-8" style={{ background: `linear-gradient(180deg, ${accentColor}15, transparent)` }}>
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition mb-4">
          <ArrowLeft size={16} /> Back
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl font-bold text-white mb-2"
        >
          {genre.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-neutral-400 leading-relaxed max-w-md"
        >
          {genre.description}
        </motion.p>
      </div>

      <div className="px-4 space-y-6">
        {/* Color palette */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3">Color Palette</h3>
          <div className="flex gap-2 flex-wrap">
            {genre.colorRules.palette.map((color) => (
              <span
                key={color}
                className="px-3 py-1 rounded-full bg-white/5 text-xs text-neutral-300 capitalize"
              >
                {color.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Style rules */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3">Style Rules</h3>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-neutral-500 uppercase tracking-wider mb-1">Silhouette</p>
              <p className="text-neutral-300 capitalize">{genre.fitRules.silhouette.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-neutral-500 uppercase tracking-wider mb-1">Must Have</p>
              <div className="flex flex-wrap gap-1.5">
                {genre.mustHave.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[11px]">
                    {item.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-neutral-500 uppercase tracking-wider mb-1">Avoid</p>
              <div className="flex flex-wrap gap-1.5">
                {genre.forbidden.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[11px]">
                    {item.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reference brands */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-3">Reference Brands</h3>
          <div className="flex flex-wrap gap-2">
            {genre.referenceBrands.map((brand) => (
              <span
                key={brand}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-xs font-medium text-neutral-300"
              >
                {brand}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 mt-3">
            Price range: ${genre.priceRange.min} — ${genre.priceRange.max}
          </p>
        </motion.div>

        {/* Sample items from catalog */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Shop {genre.name}</h3>
              <Link href={`/discover`} className="text-xs text-brand-purple">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {items.slice(0, 6).map((item) => (
                <a
                  key={item.id}
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 relative">
                    {item.imageUrls?.[0] ? (
                      <Image
                        src={item.imageUrls[0]}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 120px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full p-2">
                        <p className="text-[10px] text-neutral-500 text-center">{item.brand}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate mt-1">{item.brand}</p>
                  <p className="text-xs font-medium text-white">${item.price}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA — get outfits for this genre */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link
            href={`/dashboard?genre=${slug}`}
            className="block w-full text-center gradient-bg rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get {genre.name} Outfits
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
