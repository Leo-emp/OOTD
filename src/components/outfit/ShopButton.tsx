"use client";

import type { OutfitItem } from "@/types/outfit";
import { ShoppingBag } from "lucide-react";

// "Shop This Look" — opens affiliate links for all items
export function ShopButton({ items }: { items: OutfitItem[] }) {
  const shoppableItems = items.filter((i) => i.affiliateUrl);

  if (shoppableItems.length === 0) return null;

  return (
    <button
      onClick={() => {
        // Open each affiliate link in a new tab (max 3 to avoid popup blockers)
        shoppableItems.slice(0, 3).forEach((item) => {
          window.open(item.affiliateUrl, "_blank", "noopener");
        });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 cursor-pointer"
    >
      <ShoppingBag size={16} />
      Shop This Look ({shoppableItems.length} items)
    </button>
  );
}
