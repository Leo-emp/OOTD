import type { AiProvider } from "./provider";
import { geminiProvider } from "./gemini";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

// 3-tier fallback: Gemini → Redis cache → static editor's picks
// Ensures the app NEVER shows an error for outfit recommendations

const TIMEOUT_MS = 10_000; // 10 second timeout on AI calls

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
): Promise<Awaited<ReturnType<AiProvider["generateOutfits"]>>> {
  // Tier 1: Try Gemini with timeout
  try {
    const result = await withTimeout(geminiProvider.generateOutfits(params), TIMEOUT_MS);
    // Cache successful result for 1 hour
    await cacheSet(cacheKey, result, 3600);
    return result;
  } catch (error) {
    console.error("[AI Fallback] Gemini failed, trying cache:", error);
  }

  // Tier 2: Try cached response
  const cached = await cacheGet<Awaited<ReturnType<AiProvider["generateOutfits"]>>>(cacheKey);
  if (cached) {
    console.log("[AI Fallback] Serving from cache");
    return cached;
  }

  // Tier 3: Static editor's picks — always available
  console.log("[AI Fallback] Serving editor's picks");
  return {
    outfits: [], // Will be populated by getEditorsPicks() in the outfit route
  };
}

// Re-export the provider for non-fallback calls (chat, analysis)
export { geminiProvider };
