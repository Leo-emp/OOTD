"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Outfit } from "@/types/outfit";
import { ShopButton } from "./ShopButton";
import { FlatLayView } from "./FlatLayView";
import { Heart, ArrowRight, X, Maximize2, Share2, ZoomIn } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

// Swipe threshold — must drag this far to trigger a rating
const SWIPE_THRESHOLD = 100;

// Haptic feedback — short vibration on mobile for rate actions
function haptic() {
  try { navigator?.vibrate?.(10); } catch {}
}

// Editorial layout variants — alternate between different card compositions
// Each variant changes the grid structure for visual variety in the feed
type LayoutVariant = "standard" | "hero-full" | "editorial-split" | "mosaic";

// Determine layout based on card index — cycles through 4 variants
function getLayoutVariant(index: number): LayoutVariant {
  const variants: LayoutVariant[] = ["standard", "hero-full", "editorial-split", "mosaic"];
  return variants[index % variants.length];
}

// Premium outfit card — editorial layout with flat-lay composite + items grid toggle
// Supports Tinder-style swipe: right = love, left = hate, up = skip
// Layout variant alternates based on cardIndex for visual variety
export function OutfitCard({
  outfit,
  onRate,
  cardIndex = 0,
}: {
  outfit: Outfit;
  onRate: (rating: "love" | "skip" | "hate") => void;
  cardIndex?: number;
}) {
  const { toast } = useToast();
  const [swiping, setSwiping] = useState(false);
  const constraintsRef = useRef(null);

  // Framer Motion values for swipe gesture tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Rotate card slightly based on horizontal drag
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  // Show love/hate overlay opacity based on drag direction
  const loveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const hateOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const skipOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  // Handle swipe end — trigger rating if past threshold
  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset } = info;
    if (offset.x > SWIPE_THRESHOLD) {
      haptic();
      toast("Outfit saved!", "success");
      onRate("love");
    } else if (offset.x < -SWIPE_THRESHOLD) {
      haptic();
      onRate("hate");
    } else if (offset.y < -SWIPE_THRESHOLD) {
      onRate("skip");
    }
    setSwiping(false);
  }

  // Split items: hero pieces (top/outerwear) get larger cards
  const heroItems = outfit.items.filter((i) => i.position === "outerwear" || i.position === "top");
  const otherItems = outfit.items.filter((i) => i.position !== "outerwear" && i.position !== "top");
  const layout = getLayoutVariant(cardIndex);

  return (
    <motion.div
      ref={constraintsRef}
      className="glass rounded-2xl p-6 space-y-5 max-w-lg mx-auto relative touch-none select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, rotate: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setSwiping(true)}
      onDragEnd={handleDragEnd}
    >
      {/* Swipe direction indicators — appear during drag */}
      <motion.div
        style={{ opacity: loveOpacity }}
        className="absolute top-4 left-4 z-10 rounded-xl border-2 border-green-400 px-3 py-1 text-green-400 font-bold text-sm uppercase rotate-[-15deg] pointer-events-none"
      >
        Love
      </motion.div>
      <motion.div
        style={{ opacity: hateOpacity }}
        className="absolute top-4 right-4 z-10 rounded-xl border-2 border-red-400 px-3 py-1 text-red-400 font-bold text-sm uppercase rotate-[15deg] pointer-events-none"
      >
        Nope
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-xl border-2 border-neutral-400 px-3 py-1 text-neutral-400 font-bold text-sm uppercase pointer-events-none"
      >
        Skip
      </motion.div>

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

      {/* Items display — editorial layout variants + flat-lay toggle */}
      <FlatLayView
        items={outfit.items}
        genreSlug={outfit.genreSlug}
        defaultView="grid"
        renderGrid={() => (
          <EditorialGrid
            layout={layout}
            heroItems={heroItems}
            otherItems={otherItems}
          />
        )}
      />

      {/* Style explanation */}
      <p className="text-sm text-neutral-400 leading-relaxed">
        {outfit.styleExplanation}
      </p>

      {/* Action buttons — swipe interface + haptic feedback */}
      <div className="flex items-center justify-center gap-5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { haptic(); onRate("hate"); }}
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
          onClick={() => { haptic(); toast("Outfit saved!", "success"); onRate("love"); }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-pink/30 bg-brand-pink/10 text-brand-pink transition hover:bg-brand-pink/20 cursor-pointer"
          aria-label="Love this outfit"
        >
          <Heart size={20} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => {
            const genreName = outfit.genreSlug.replace(/-/g, " ");
            const text = `Check out this ${genreName} outfit on OOTD AI!\n\n${outfit.styleExplanation}`;
            if (navigator.share) {
              navigator.share({ title: "OOTD AI Outfit", text, url: window.location.origin }).catch(() => {});
            } else {
              navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard", "info")).catch(() => {});
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition hover:border-brand-purple/50 hover:text-brand-purple cursor-pointer"
          aria-label="Share this outfit"
        >
          <Share2 size={16} />
        </motion.button>
      </div>

      {/* View details + Shop this look */}
      <div className="flex gap-3">
        <Link
          href={`/outfit/${outfit.id}`}
          onClick={() => {
            // Store in sessionStorage so the detail page can load it
            try { sessionStorage.setItem(`outfit-${outfit.id}`, JSON.stringify(outfit)); } catch {}
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-neutral-300 transition hover:bg-white/10"
        >
          <Maximize2 size={14} />
          Details
        </Link>
        <div className="flex-1">
          <ShopButton items={outfit.items} />
        </div>
      </div>
    </motion.div>
  );
}

// Editorial grid — renders items in different layout compositions
// Variant "standard": 2-col hero + 3-col secondary (original)
// Variant "hero-full": single full-width hero + 4-col accessories
// Variant "editorial-split": asymmetric 60/40 split with large + stacked
// Variant "mosaic": Pinterest-style mixed aspect ratios
function EditorialGrid({
  layout,
  heroItems,
  otherItems,
}: {
  layout: LayoutVariant;
  heroItems: Outfit["items"];
  otherItems: Outfit["items"];
}) {
  const allItems = [...heroItems, ...otherItems];

  switch (layout) {
    // Full-width hero piece with smaller accessories row
    case "hero-full":
      return (
        <>
          {allItems[0] && (
            <div className="mb-3">
              <ItemCard item={allItems[0]} delay={0} size="hero" />
            </div>
          )}
          {allItems.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allItems.slice(1).map((item, i) => (
                <ItemCard key={item.itemId} item={item} delay={(i + 1) * 0.05} size="small" />
              ))}
            </div>
          )}
        </>
      );

    // Asymmetric editorial split — one large left, stacked right
    case "editorial-split":
      return (
        <div className="grid grid-cols-5 gap-3">
          {/* Left — large feature image (3/5 width) */}
          <div className="col-span-3">
            {allItems[0] && (
              <ItemCard item={allItems[0]} delay={0} size="large" />
            )}
          </div>
          {/* Right — stacked smaller images (2/5 width) */}
          <div className="col-span-2 flex flex-col gap-3">
            {allItems.slice(1, 3).map((item, i) => (
              <ItemCard key={item.itemId} item={item} delay={(i + 1) * 0.05} size="small" />
            ))}
          </div>
          {/* Remaining items in a row below */}
          {allItems.length > 3 && (
            <div className="col-span-5 grid grid-cols-3 gap-3">
              {allItems.slice(3).map((item, i) => (
                <ItemCard key={item.itemId} item={item} delay={(i + 3) * 0.05} size="small" />
              ))}
            </div>
          )}
        </div>
      );

    // Mosaic — mixed aspect ratios for visual interest
    case "mosaic":
      return (
        <div className="grid grid-cols-3 gap-3">
          {allItems.map((item, i) => {
            // First and last items span 2 columns for mosaic effect
            const span = (i === 0 || i === allItems.length - 1) && allItems.length > 2;
            return (
              <div key={item.itemId} className={span ? "col-span-2" : ""}>
                <ItemCard
                  item={item}
                  delay={i * 0.05}
                  size={span ? "large" : "small"}
                  aspectOverride={span ? "aspect-[16/9]" : undefined}
                />
              </div>
            );
          })}
        </div>
      );

    // Standard — original 2+3 grid layout
    default:
      return (
        <>
          {heroItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {heroItems.map((item, i) => (
                <ItemCard key={item.itemId} item={item} delay={i * 0.05} size="large" />
              ))}
            </div>
          )}
          {otherItems.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {otherItems.map((item, i) => (
                <ItemCard key={item.itemId} item={item} delay={(heroItems.length + i) * 0.05} size="small" />
              ))}
            </div>
          )}
        </>
      );
  }
}

// Individual item card — premium treatment with studio photo, shimmer, and lightbox zoom
function ItemCard({
  item,
  delay,
  size,
  aspectOverride,
}: {
  item: Outfit["items"][0];
  delay: number;
  size: "large" | "small" | "hero";
  aspectOverride?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  // Size-responsive image sizes hint for Next.js
  const imageSizes = size === "hero"
    ? "(max-width: 768px) 100vw, 500px"
    : size === "large"
      ? "(max-width: 768px) 50vw, 250px"
      : "(max-width: 768px) 33vw, 150px";

  // Aspect ratio — hero is wider (16:9), default is 3:4
  const aspect = aspectOverride || (size === "hero" ? "aspect-[16/9]" : "aspect-[3/4]");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 30 }}
      className="group relative"
    >
      {/* Wrap in lightbox — tap to open full-screen zoom */}
      <ImageLightbox src={item.imageUrl || ""} alt={`${item.brand} ${item.name}`}>
        {(openLightbox) => (
          <div
            className={`relative ${aspect} overflow-hidden rounded-xl bg-white/5 shadow-subtle cursor-zoom-in`}
            onClick={(e) => {
              e.stopPropagation();
              if (item.imageUrl) openLightbox();
            }}
          >
            {/* Shimmer placeholder — visible until image loads */}
            {item.imageUrl && !loaded && (
              <div className="absolute inset-0 shimmer" />
            )}
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes={imageSizes}
                className={`object-cover transition-all duration-300 group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0"}`}
                quality={90}
                onLoad={() => setLoaded(true)}
              />
            )}
            {/* Zoom indicator — appears on hover */}
            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={12} />
            </div>
            {/* Hover overlay — shows item name + brand */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3">
              <p className="text-xs font-medium text-white truncate">{item.name}</p>
              {item.brand && (
                <p className="text-xs text-white/60 truncate">{item.brand}</p>
              )}
            </div>
          </div>
        )}
      </ImageLightbox>
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
