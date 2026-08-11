// ── Eval: Prompt Guardrails ──
// Tests that prompt engineering guardrails work correctly
// Validates: input sanitization, prompt structure, genre rule injection
// These run WITHOUT calling Gemini — they test the prompt building logic

import { describe, it, expect } from "vitest";
import { buildOutfitPrompt, buildRatingPrompt, buildStylistSystemPrompt } from "@/lib/ai/prompts";
import type { GenreRuleset } from "@/types/genre";
import type { CandidateItem } from "@/lib/ai/provider";

// Mock genre ruleset for testing
const mockGenre: GenreRuleset = {
  id: "test-1",
  slug: "old-money",
  name: "Old Money",
  description: "Timeless luxury",
  colorRules: {
    palette: ["navy", "cream", "burgundy", "camel"],
    maxColorsPerOutfit: 4,
    forbiddenColors: ["neon", "hot pink"],
  },
  fitRules: {
    silhouette: "tailored and structured",
    forbiddenFits: ["oversized streetwear", "crop tops"],
    logoVisibility: "subtle or none",
  },
  mustHave: ["tailored blazer", "leather belt"],
  forbidden: ["graphic tees", "chunky sneakers", "ripped jeans"],
  occasionModifiers: {
    casual: "relaxed prep — polo, chinos, loafers",
    formal: "classic suiting — navy blazer, trousers, Oxford shoes",
  },
  priceRange: { min: 50, max: 500 },
  referenceBrands: ["Ralph Lauren", "Loro Piana", "Brunello Cucinelli"],
};

// Mock candidate items
const mockItems: CandidateItem[] = [
  { id: "w_1", name: "Navy Blazer", brand: "Ralph Lauren", price: 250, category: "outerwear", color: "navy", genreTags: ["old-money"], isWardrobe: true },
  { id: "c_1", name: "Cream Chinos", brand: "J.Crew", price: 80, category: "bottom", color: "cream", genreTags: ["old-money", "minimalist"], isWardrobe: false },
];

describe("buildOutfitPrompt", () => {
  it("includes genre rules in the prompt", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("Old Money");
    expect(prompt).toContain("navy");
    expect(prompt).toContain("tailored blazer");
    expect(prompt).toContain("graphic tees");
  });

  it("includes available items with IDs", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("w_1");
    expect(prompt).toContain("c_1");
    expect(prompt).toContain("Navy Blazer");
  });

  it("separates wardrobe items from catalog items", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("USER'S OWN WARDROBE");
    expect(prompt).toContain("OWNED");
    expect(prompt).toContain("CATALOG");
  });

  it("includes weather when provided", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual", "cold");
    expect(prompt).toContain("cold");
  });

  it("includes occasion modifier from genre rules", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("relaxed prep");
  });

  it("includes JSON schema in the prompt", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("catalogItemId");
    expect(prompt).toContain("styleExplanation");
    expect(prompt).toContain("position");
  });

  it("requests 3-5 outfits with 4-6 items each", () => {
    const prompt = buildOutfitPrompt(mockGenre, mockItems, "casual");
    expect(prompt).toContain("3-5 complete outfits");
    expect(prompt).toContain("4-6 items");
  });
});

describe("buildRatingPrompt", () => {
  it("includes genre color palette for judging", () => {
    const prompt = buildRatingPrompt(mockGenre);
    expect(prompt).toContain("navy");
    expect(prompt).toContain("cream");
    expect(prompt).toContain("burgundy");
  });

  it("includes forbidden items to check against", () => {
    const prompt = buildRatingPrompt(mockGenre);
    expect(prompt).toContain("graphic tees");
    expect(prompt).toContain("chunky sneakers");
  });

  it("specifies 1-10 scoring range", () => {
    const prompt = buildRatingPrompt(mockGenre);
    expect(prompt).toContain("1-10");
  });

  it("requests improvements array", () => {
    const prompt = buildRatingPrompt(mockGenre);
    expect(prompt).toContain("improvements");
  });
});

describe("buildStylistSystemPrompt", () => {
  it("sets fashion-only topic restriction", () => {
    const prompt = buildStylistSystemPrompt(mockGenre);
    expect(prompt).toContain("Only answer fashion-related questions");
  });

  it("includes genre reference brands", () => {
    const prompt = buildStylistSystemPrompt(mockGenre);
    expect(prompt).toContain("Ralph Lauren");
    expect(prompt).toContain("Loro Piana");
  });

  it("includes user profile when provided", () => {
    const prompt = buildStylistSystemPrompt(mockGenre, "Tall, athletic build, prefers earth tones");
    expect(prompt).toContain("Tall, athletic build");
  });

  it("includes recent outfits when provided", () => {
    const prompt = buildStylistSystemPrompt(mockGenre, undefined, "Rated 8/10 on navy outfit");
    expect(prompt).toContain("Rated 8/10");
  });

  it("does not leak system instructions into the prompt", () => {
    const prompt = buildStylistSystemPrompt(mockGenre);
    // The prompt should not contain raw system delimiters that could be exploited
    expect(prompt).not.toContain("SYSTEM:");
    expect(prompt).not.toContain("<<SYS>>");
  });
});
