"use client";

import { useState, useCallback, useRef } from "react";
import type { Outfit, Rating } from "@/types/outfit";

// Hook for fetching and rating outfits
export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Abort previous fetch when genre/occasion changes rapidly
  const abortRef = useRef<AbortController | null>(null);
  // Prevent double-rating on rapid swipes
  const ratingInFlight = useRef(false);

  // Fetch outfits from the API
  const fetchOutfits = useCallback(async (params: {
    genre: string;
    occasion?: string;
    weather?: string;
  }) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const searchParams = new URLSearchParams({
      genre: params.genre,
      ...(params.occasion && { occasion: params.occasion }),
      ...(params.weather && { weather: params.weather }),
    });

    try {
      const res = await fetch(`/api/outfits/generate?${searchParams}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate outfits");
      }
      const data = await res.json();
      setOutfits(data.outfits);
      setCurrentIndex(0);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Rate the current outfit and advance to the next one
  const rateOutfit = useCallback(async (rating: Rating) => {
    const outfit = outfits[currentIndex];
    if (!outfit || ratingInFlight.current) return;

    // Guard against double-rating on rapid swipes
    ratingInFlight.current = true;

    // Optimistic — advance immediately
    setCurrentIndex((prev) => prev + 1);

    // Fire rating to API in background
    fetch("/api/outfits/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: outfit.id, rating }),
    })
      .catch(console.error)
      .finally(() => { ratingInFlight.current = false; });
  }, [outfits, currentIndex]);

  // Prefetch adjacent genres — warms the cache so switching feels instant
  const prefetch = useCallback((genre: string, occasion?: string) => {
    const params = new URLSearchParams({ genre, ...(occasion && { occasion }) });
    fetch(`/api/outfits/generate?${params}`, { priority: "low" as RequestPriority }).catch(() => {});
  }, []);

  const currentOutfit = outfits[currentIndex] || null;
  const hasMore = currentIndex < outfits.length;

  return {
    outfits,
    currentOutfit,
    currentIndex,
    hasMore,
    loading,
    error,
    fetchOutfits,
    rateOutfit,
    prefetch,
  };
}
