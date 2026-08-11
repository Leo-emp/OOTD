"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ShopButton } from "@/components/outfit/ShopButton";
import { FlatLayView } from "@/components/outfit/FlatLayView";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// Outfit detail view — shows all items in a curated outfit
// Accessed when user taps an outfit card from dashboard
// Displays: flat-lay composite / items grid toggle, style notes, total price, shop all

type Position = "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "bag";

interface OutfitItem {
  itemId: string;
  itemType: "catalog" | "wardrobe";
  position: Position;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  color: string;
}

interface OutfitDetail {
  id: string;
  genreSlug: string;
  occasion: string;
  weather?: string;
  items: OutfitItem[];
  styleExplanation: string;
  totalPrice: number;
  source: string;
}

// Position display order — hero first, then supporting pieces
const POSITION_ORDER = ["top", "bottom", "shoes", "outerwear", "accessory", "bag"];
const POSITION_LABELS: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessory: "Accessory",
  bag: "Bag",
};

export default function OutfitDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Load outfit from sessionStorage first (instant), fall back to API fetch
  useEffect(() => {
    let found = false;
    try {
      const stored = sessionStorage.getItem(`outfit-${id}`);
      if (stored) {
        setOutfit(JSON.parse(stored));
        found = true;
      }
    } catch {}

    if (found) {
      setLoading(false);
      return;
    }

    // Fallback: fetch from DB API (handles shared links, page refresh, empty sessionStorage)
    fetch(`/api/outfits/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setOutfit(data.outfit))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4 max-w-lg mx-auto">
          <div className="h-8 w-32 rounded-lg bg-white/5" />
          <div className="h-96 rounded-2xl bg-white/5" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!outfit) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-neutral-400">Outfit not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            Back to outfits
          </button>
        </div>
      </main>
    );
  }

  // Sort items by position order
  const sortedItems = [...outfit.items].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  );

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Back button + genre badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const text = `Check out this ${outfit.genreSlug.replace(/-/g, " ")} outfit on OOTD AI!\n\n${outfit.styleExplanation}`;
              if (navigator.share) {
                navigator.share({ title: "OOTD AI Outfit", text, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard", "info")).catch(() => {});
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-brand-purple transition cursor-pointer"
            aria-label="Share outfit"
          >
            <Share2 size={14} />
          </button>
          <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-neutral-300 capitalize">
            {outfit.genreSlug.replace("-", " ")} · {outfit.occasion}
          </span>
        </div>
      </motion.div>

      {/* Style explanation card */}
      {outfit.styleExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 mb-6"
        >
          <p className="text-sm text-neutral-300 leading-relaxed italic">
            &ldquo;{outfit.styleExplanation}&rdquo;
          </p>
        </motion.div>
      )}

      {/* Flat-lay composite / items grid toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <FlatLayView
          items={sortedItems}
          genreSlug={outfit.genreSlug}
          defaultView="grid"
          renderGrid={() => (
            <>
              {/* Hero item — large display (first item in sorted order) */}
              <div className="relative rounded-2xl overflow-hidden mb-4 group">
                <div className="aspect-[3/4] bg-white/5 relative">
                  {sortedItems[0]?.imageUrl ? (
                    <Image
                      src={sortedItems[0].imageUrl}
                      alt={sortedItems[0].name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-lg font-heading font-bold text-white">{sortedItems[0]?.brand}</p>
                        <p className="text-sm text-neutral-400">{sortedItems[0]?.name}</p>
                      </div>
                    </div>
                  )}
                  {/* Gradient overlay with info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">
                      {POSITION_LABELS[sortedItems[0]?.position] || sortedItems[0]?.position}
                    </p>
                    <p className="font-heading font-bold text-white text-lg">{sortedItems[0]?.brand}</p>
                    <p className="text-sm text-neutral-300">{sortedItems[0]?.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-brand-400 font-semibold">${sortedItems[0]?.price}</p>
                      <ShopButton items={[sortedItems[0]]} label="Shop" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of items — 2-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {sortedItems.slice(1).map((item, index) => (
                  <motion.div
                    key={item.itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className={`relative rounded-xl overflow-hidden group cursor-pointer ${
                      activeItem === item.itemId ? "ring-2 ring-brand-400" : ""
                    }`}
                    onClick={() => setActiveItem(activeItem === item.itemId ? null : item.itemId)}
                  >
                    <div className="aspect-[3/4] bg-white/5 relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3">
                          <div className="text-center">
                            <p className="text-xs font-bold text-white">{item.brand}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">{item.name}</p>
                          </div>
                        </div>
                      )}
                      {/* Info overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                          {POSITION_LABELS[item.position] || item.position}
                        </p>
                        <p className="text-xs font-bold text-white truncate">{item.brand}</p>
                        <p className="text-[10px] text-neutral-300 truncate">{item.name}</p>
                        <p className="text-xs text-brand-400 font-semibold mt-0.5">${item.price}</p>
                      </div>
                    </div>

                    {/* Expanded shop action */}
                    <AnimatePresence>
                      {activeItem === item.itemId && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-white/5 overflow-hidden"
                        >
                          <div className="p-3">
                            <ShopButton items={[item]} label="Shop this item" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        />
      </motion.div>

      {/* Total price + Shop All */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Complete outfit</p>
            <p className="font-heading text-2xl font-bold text-white">
              ${outfit.totalPrice.toLocaleString()}
            </p>
          </div>
          <span className="text-xs text-neutral-500">{outfit.items.length} pieces</span>
        </div>

        <ShopButton items={outfit.items} label="Shop complete outfit" />
      </motion.div>
    </main>
  );
}
