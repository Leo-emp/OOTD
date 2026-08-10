"use client";

import { useCallback, useRef } from "react";

// Signal types that match the engagement API
type SignalType = "view" | "click_item" | "click_buy" | "save" | "share" | "flatlay" | "unsave" | "time_long";

interface EngagementSignal {
  type: SignalType;
  itemColor?: string;
  itemBrand?: string;
  itemCategory?: string;
  itemPrice?: number;
  genreSlug?: string;
}

// Batches engagement signals and flushes them periodically or on unload
// Signals are lightweight — they accumulate into the preference model over time
export function useEngagement() {
  const bufferRef = useRef<EngagementSignal[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush buffered signals to the API
  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;

    const signals = [...bufferRef.current];
    bufferRef.current = [];

    // Fire-and-forget — engagement should never block UX
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signals }),
    }).catch(() => {});
  }, []);

  // Add a signal to the buffer, auto-flush after 10 signals or 30s
  const track = useCallback((signal: EngagementSignal) => {
    bufferRef.current.push(signal);

    // Flush at 10 signals (batch efficiency)
    if (bufferRef.current.length >= 10) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      flush();
      return;
    }

    // Start/reset the 30s timer for smaller batches
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 30000);
  }, [flush]);

  // Track an outfit view — called when an outfit card is shown
  const trackView = useCallback((genreSlug: string) => {
    track({ type: "view", genreSlug });
  }, [track]);

  // Track clicking on a specific item
  const trackItemClick = useCallback((item: {
    color?: string;
    brand?: string;
    category?: string;
    price?: number;
    genreSlug?: string;
  }) => {
    track({
      type: "click_item",
      itemColor: item.color,
      itemBrand: item.brand,
      itemCategory: item.category,
      itemPrice: item.price,
      genreSlug: item.genreSlug,
    });
  }, [track]);

  // Track clicking a buy/affiliate link
  const trackBuyClick = useCallback((item: {
    color?: string;
    brand?: string;
    price?: number;
    genreSlug?: string;
  }) => {
    track({
      type: "click_buy",
      itemColor: item.color,
      itemBrand: item.brand,
      itemPrice: item.price,
      genreSlug: item.genreSlug,
    });
  }, [track]);

  // Track saving/unsaving an outfit
  const trackSave = useCallback((genreSlug: string) => {
    track({ type: "save", genreSlug });
  }, [track]);

  const trackUnsave = useCallback((genreSlug: string) => {
    track({ type: "unsave", genreSlug });
  }, [track]);

  return {
    track,
    trackView,
    trackItemClick,
    trackBuyClick,
    trackSave,
    trackUnsave,
    flush,
  };
}
