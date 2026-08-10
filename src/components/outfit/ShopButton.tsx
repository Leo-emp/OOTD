"use client";

import type { OutfitItem } from "@/types/outfit";

// "Shop This Look" — opens affiliate links for all items
export function ShopButton({ items, label }: { items: OutfitItem[]; label?: string }) {
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
      {label || `Shop This Look (${shoppableItems.length} items)`}
    </button>
  );
}
