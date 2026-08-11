// ── Agentic Outfit Pipeline ──
// Multi-step AI agent that chains tools together for smarter outfit generation
// Pattern: Analyze wardrobe → Identify gaps → Semantic search → Generate → Verify
// Each step feeds into the next — the agent makes decisions at each stage

import type { GenreRuleset } from "@/types/genre";
import type { CandidateItem, UserPreferences } from "./provider";
import type { AiOutfitResponse } from "@/types/ai";
import { geminiProvider } from "./gemini";
import { semanticSearch, findSimilarItems } from "./embeddings";
import { db } from "@/lib/db";
import { wardrobeItems, catalogItems, catalogEmbeddings } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import type { BodyProfile } from "@/lib/styling/body-rules";
import type { ColorProfile } from "@/lib/styling/color-theory";

// Agent step result — tracks what happened at each stage
interface AgentStep {
  step: string;
  input: string;
  output: string;
  durationMs: number;
}

// Full agent result — the outfits plus the trace of how it got there
export interface AgentResult {
  outfits: AiOutfitResponse;
  steps: AgentStep[];
  totalDurationMs: number;
}

// ── Tool: Analyze Wardrobe ──
// Fetches user's wardrobe items and categorizes what they have vs don't
async function analyzeWardrobe(userId: string): Promise<{
  items: CandidateItem[];
  categories: Record<string, number>;
  gaps: string[];
}> {
  const items = await db
    .select()
    .from(wardrobeItems)
    .where(eq(wardrobeItems.userId, userId));

  // Count items per category
  const categories: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || "other";
    categories[cat] = (categories[cat] || 0) + 1;
  }

  // Identify gaps — categories with zero or very few items
  const essentials = ["top", "bottom", "shoes", "outerwear"];
  const gaps = essentials.filter((cat) => !categories[cat] || categories[cat] < 2);

  // Convert to CandidateItem format
  const candidates: CandidateItem[] = items.map((item) => ({
    id: item.id,
    name: `My ${item.category || "item"}`,
    brand: "My Wardrobe",
    price: 0,
    category: item.category || "top",
    color: item.color || "unknown",
    genreTags: (item.genreTags as string[]) || [],
    isWardrobe: true,
    imageUrl: item.imageUrl,
  }));

  return { items: candidates, categories, gaps };
}

// ── Tool: Semantic Catalog Search ──
// Uses RAG embeddings to find catalog items that complement the wardrobe
async function searchCatalog(
  query: string,
  genre: string,
  limit: number = 15
): Promise<CandidateItem[]> {
  // Check if embeddings exist
  const embeddingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(catalogEmbeddings)
    .get();

  let itemIds: string[];

  if (embeddingCount && embeddingCount.count > 0) {
    // Use semantic search when embeddings are available
    const results = await semanticSearch(query, limit, 0.4);
    itemIds = results.map((r) => r.itemId);
  } else {
    // Fallback to SQL keyword search when no embeddings exist
    const items = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(sql`${catalogItems.genreTags} LIKE '%${genre}%'`)
      .limit(limit);
    itemIds = items.map((i) => i.id);
  }

  if (itemIds.length === 0) return [];

  // Fetch full item details
  const items = await db
    .select()
    .from(catalogItems)
    .where(inArray(catalogItems.id, itemIds));

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    category: item.category,
    color: item.color,
    genreTags: item.genreTags,
    isWardrobe: false,
    imageUrl: (item.imageUrls as string[])?.[0],
  }));
}

// ── Tool: Verify Color Harmony ──
// Post-generation check — validates that outfit colors work together
function verifyColorHarmony(
  outfits: AiOutfitResponse,
  candidates: CandidateItem[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const itemMap = new Map(candidates.map((c) => [c.id, c]));

  for (let i = 0; i < outfits.outfits.length; i++) {
    const outfit = outfits.outfits[i];
    const colors = outfit.items
      .map((item) => itemMap.get(item.catalogItemId)?.color)
      .filter(Boolean) as string[];

    // Flag outfits with more than 4 distinct colors (too busy)
    const uniqueColors = new Set(colors.map((c) => c.toLowerCase()));
    if (uniqueColors.size > 4) {
      issues.push(`Outfit ${i + 1}: ${uniqueColors.size} colors is too busy, aim for 3-4`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ── Main Agent Loop ──
// Orchestrates the multi-step pipeline with tool calls at each stage
export async function agentGenerateOutfits(params: {
  userId: string;
  genre: GenreRuleset;
  occasion: string;
  weather?: string;
  userPreferences?: UserPreferences;
  bodyProfile?: BodyProfile;
  colorProfile?: ColorProfile;
}): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const startTime = Date.now();

  // ── Step 1: Analyze Wardrobe ──
  const step1Start = Date.now();
  const wardrobe = await analyzeWardrobe(params.userId);
  steps.push({
    step: "analyze_wardrobe",
    input: `User ${params.userId}`,
    output: `${wardrobe.items.length} items, gaps: [${wardrobe.gaps.join(", ")}]`,
    durationMs: Date.now() - step1Start,
  });

  // ── Step 2: Identify Gaps + Build Search Query ──
  const step2Start = Date.now();
  const searchQuery = [
    `${params.genre.name} style`,
    params.occasion,
    params.weather ? `for ${params.weather} weather` : "",
    wardrobe.gaps.length > 0 ? `need: ${wardrobe.gaps.join(", ")}` : "",
    params.userPreferences?.preferredColors?.length
      ? `colors: ${params.userPreferences.preferredColors.join(", ")}`
      : "",
  ].filter(Boolean).join(". ");
  steps.push({
    step: "build_search_query",
    input: `Genre: ${params.genre.name}, gaps: ${wardrobe.gaps.join(",")}`,
    output: searchQuery,
    durationMs: Date.now() - step2Start,
  });

  // ── Step 3: Semantic Catalog Search (RAG retrieval) ──
  const step3Start = Date.now();
  const catalogResults = await searchCatalog(searchQuery, params.genre.slug);
  steps.push({
    step: "semantic_search",
    input: searchQuery,
    output: `${catalogResults.length} catalog items found`,
    durationMs: Date.now() - step3Start,
  });

  // ── Step 4: Generate Outfits (AI generation with retrieved context) ──
  const step4Start = Date.now();
  const allCandidates = [...wardrobe.items, ...catalogResults];
  const outfits = await geminiProvider.generateOutfits({
    genre: params.genre,
    candidateItems: allCandidates,
    occasion: params.occasion,
    weather: params.weather,
    userPreferences: params.userPreferences,
    bodyProfile: params.bodyProfile,
    colorProfile: params.colorProfile,
  });
  steps.push({
    step: "generate_outfits",
    input: `${allCandidates.length} candidates (${wardrobe.items.length} wardrobe + ${catalogResults.length} catalog)`,
    output: `${outfits.outfits.length} outfits generated`,
    durationMs: Date.now() - step4Start,
  });

  // ── Step 5: Verify Color Harmony (post-generation guardrail) ──
  const step5Start = Date.now();
  const harmony = verifyColorHarmony(outfits, allCandidates);
  steps.push({
    step: "verify_color_harmony",
    input: `${outfits.outfits.length} outfits`,
    output: harmony.valid
      ? "All outfits pass color harmony check"
      : `Issues: ${harmony.issues.join("; ")}`,
    durationMs: Date.now() - step5Start,
  });

  return {
    outfits,
    steps,
    totalDurationMs: Date.now() - startTime,
  };
}
