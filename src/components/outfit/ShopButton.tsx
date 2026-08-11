"use client";

import type { OutfitItem } from "@/types/outfit";

// "Shop This Look" — opens affiliate links for shoppable items
// Opens first link directly (trusted user click = no popup blocker),
// subsequent items go into the same tab with a small delay
export function ShopButton({ items, label }: { items: OutfitItem[]; label?: string }) {
  const shoppableItems = items.filter((i) => i.affiliateUrl);

  if (shoppableItems.length === 0) return null;

  return (
    <button
      onClick={() => {
        // First link opens in a new tab (trusted event — popup blockers allow this)
        if (shoppableItems[0]) {
          window.open(shoppableItems[0].affiliateUrl, "_blank", "noopener");
        }

        // Additional items open after short delays to avoid popup blockers
        shoppableItems.slice(1, 3).forEach((item, i) => {
          setTimeout(() => {
            window.open(item.affiliateUrl, "_blank", "noopener");
          }, (i + 1) * 500);
        });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 cursor-pointer"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
      {label || `Shop This Look (${shoppableItems.length} items)`}
    </button>
  );
}
