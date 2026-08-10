"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Outfit } from "@/types/outfit";
import { ShopButton } from "./ShopButton";
import { Heart, ArrowRight, X } from "lucide-react";

// Premium outfit card — editorial layout with high-res studio product images
// Primary view: individual item cards (not flat-lay composite)
export function OutfitCard({
  outfit,
  onRate,
}: {
  outfit: Outfit;
  onRate: (rating: "love" | "skip" | "hate") => void;
}) {
  // Split items: hero pieces (top/outerwear) get larger cards
  const heroItems = outfit.items.filter((i) => i.position === "outerwear" || i.position === "top");
  const otherItems = outfit.items.filter((i) => i.position !== "outerwear" && i.position !== "top");

  return (
    <motion.div
      className="glass rounded-2xl p-6 space-y-5 max-w-lg mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, rotate: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Outfit name + genre badge */}
      <div>
        <h3 className="font-heading text-xl font-bold text-white">
          {outfit.styleExplanation.split(".")[0]}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-neutral-400 capitalize">{outfit.genreSlug.replace("-", " ")}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-sm text-neutral-400 capitalize">{outfit.occasion}</span>
          {outfit.weather && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-sm text-neutral-400 capitalize">{outfit.weather}</span>
            </>
          )}
          {outfit.totalPrice && (
            <>
              <span className="text-neutral-600">·</span>
              <span className="text-sm text-brand-purple">${outfit.totalPrice.toFixed(0)}</span>
            </>
          )}
        </div>
      </div>

      {/* Hero items — larger cards (top/outerwear) */}
      {heroItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {heroItems.map((item, i) => (
            <ItemCard key={item.itemId} item={item} delay={i * 0.05} size="large" />
          ))}
        </div>
      )}

      {/* Other items — smaller cards (bottom, shoes, accessories) */}
      {otherItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {otherItems.map((item, i) => (
            <ItemCard key={item.itemId} item={item} delay={(heroItems.length + i) * 0.05} size="small" />
          ))}
        </div>
      )}

      {/* Style explanation */}
      <p className="text-sm text-neutral-400 leading-relaxed">
        {outfit.styleExplanation}
      </p>

      {/* Action buttons — swipe interface */}
      <div className="flex items-center justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onRate("hate")}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition hover:border-red-500/50 hover:text-red-400 cursor-pointer"
          aria-label="Pass on this outfit"
        >
          <X size={20} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onRate("skip")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition hover:border-white/30 hover:text-white cursor-pointer"
          aria-label="Skip this outfit"
        >
          <ArrowRight size={18} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onRate("love")}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-pink/30 bg-brand-pink/10 text-brand-pink transition hover:bg-brand-pink/20 cursor-pointer"
          aria-label="Love this outfit"
        >
          <Heart size={20} />
        </motion.button>
      </div>

      {/* Shop this look button */}
      <ShopButton items={outfit.items} />
    </motion.div>
  );
}

// Individual item card — premium treatment with studio photo
function ItemCard({
  item,
  delay,
  size,
}: {
  item: Outfit["items"][0];
  delay: number;
  size: "large" | "small";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 30 }}
      className="group relative"
    >
      {/* Studio photo — 3:4 aspect ratio, rounded corners, subtle shadow */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5 shadow-subtle">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes={size === "large" ? "(max-width: 768px) 50vw, 250px" : "(max-width: 768px) 33vw, 150px"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            quality={90}
          />
        )}
        {/* Hover overlay — shows item name + brand */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3">
          <p className="text-xs font-medium text-white truncate">{item.name}</p>
          {item.brand && (
            <p className="text-xs text-white/60 truncate">{item.brand}</p>
          )}
        </div>
      </div>
      {/* Brand + price below card */}
      <div className="mt-1.5">
        <p className="text-xs text-neutral-400 truncate">{item.brand}</p>
        {item.price && (
          <p className="text-xs font-medium text-white">${item.price}</p>
        )}
      </div>
    </motion.div>
  );
}
