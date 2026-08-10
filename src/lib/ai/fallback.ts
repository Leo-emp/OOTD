import type { AiProvider } from "./provider";
import type { AiOutfitResponse } from "@/types/ai";
import { geminiProvider } from "./gemini";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { getEditorsPicks } from "./editors-picks";
import type { Outfit } from "@/types/outfit";

// 3-tier fallback: Gemini → Redis cache → curated editor's picks
// Ensures the app NEVER shows an error or blank screen for outfit recs

const TIMEOUT_MS = 10_000; // 10 second timeout on AI calls

// Discriminated return — the route needs to know which tier responded
// Tier 1/2 return AI format (needs enrichment), tier 3 returns full Outfit objects
export type FallbackResult =
  | { source: "ai" | "cached"; aiResponse: AiOutfitResponse }
  | { source: "editors-pick"; outfits: Outfit[] };

// Wraps any async AI call with timeout
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("AI_TIMEOUT")), ms)
  );
  return Promise.race([promise, timeout]);
}

// Main AI provider with fallback chain
export async function generateOutfitsWithFallback(
  params: Parameters<AiProvider["generateOutfits"]>[0],
  cacheKey: string
): Promise<FallbackResult> {
  // Tier 1: Try Gemini with timeout
  try {
    const result = await withTimeout(geminiProvider.generateOutfits(params), TIMEOUT_MS);
    // Cache successful result for 1 hour
    await cacheSet(cacheKey, result, 3600);
    return { source: "ai", aiResponse: result };
  } catch (error) {
    console.error("[AI Fallback] Gemini failed, trying cache:", error);
  }

  // Tier 2: Try cached response
  const cached = await cacheGet<AiOutfitResponse>(cacheKey);
  if (cached) {
    console.log("[AI Fallback] Serving from cache");
    return { source: "cached", aiResponse: cached };
  }

  // Tier 3: Curated editor's picks — always returns real outfits
  // 48 handpicked outfits across 12 genres × 4 occasions, real brands/prices
  const genreSlug = params.genre.slug;
  const occasion = params.occasion;
  console.log(`[AI Fallback] Serving editor's picks for ${genreSlug}/${occasion}`);
  return {
    source: "editors-pick",
    outfits: getEditorsPicks(genreSlug, occasion),
  };
}

// Re-export the provider for non-fallback calls (chat, analysis)
export { geminiProvider };
