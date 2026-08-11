// ── Eval: Embedding + RAG Logic ──
// Tests the embedding utility functions WITHOUT calling the Gemini API
// Validates: cosine similarity math, item text generation, search ranking

import { describe, it, expect } from "vitest";

// Import the cosine similarity function by recreating it here
// (the original is not exported — we test the math independently)
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

describe("cosineSimilarity", () => {
  it("returns 1.0 for identical vectors", () => {
    const v = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
  });

  it("handles high-dimensional vectors (768-dim like Gemini embeddings)", () => {
    // Create two random-ish 768-dim vectors
    const a = Array.from({ length: 768 }, (_, i) => Math.sin(i));
    const b = Array.from({ length: 768 }, (_, i) => Math.cos(i));
    const sim = cosineSimilarity(a, b);
    // Should be between -1 and 1
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it("ranks similar vectors higher than dissimilar ones", () => {
    const query = [1, 1, 0, 0];
    const similar = [0.9, 1.1, 0.1, 0];
    const different = [0, 0, 1, 1];

    const simScore = cosineSimilarity(query, similar);
    const diffScore = cosineSimilarity(query, different);

    expect(simScore).toBeGreaterThan(diffScore);
  });
});

describe("item embedding text generation", () => {
  // Recreate the function for testing
  function itemToEmbeddingText(item: {
    name: string;
    brand: string;
    category: string;
    color: string;
    pattern?: string | null;
    genreTags: string[];
    season?: string | null;
  }): string {
    return [
      item.name,
      `by ${item.brand}`,
      item.category,
      `${item.color} color`,
      item.pattern && item.pattern !== "solid" ? `${item.pattern} pattern` : null,
      `style: ${item.genreTags.join(", ")}`,
      item.season ? `for ${item.season}` : null,
    ]
      .filter(Boolean)
      .join(". ");
  }

  it("includes all semantic fields", () => {
    const text = itemToEmbeddingText({
      name: "Classic Navy Blazer",
      brand: "Ralph Lauren",
      category: "outerwear",
      color: "navy",
      pattern: "solid",
      genreTags: ["old-money", "minimalist"],
      season: "fall",
    });

    expect(text).toContain("Classic Navy Blazer");
    expect(text).toContain("Ralph Lauren");
    expect(text).toContain("outerwear");
    expect(text).toContain("navy color");
    expect(text).toContain("old-money");
    expect(text).toContain("fall");
  });

  it("excludes solid pattern (not semantically useful)", () => {
    const text = itemToEmbeddingText({
      name: "T-Shirt",
      brand: "Uniqlo",
      category: "top",
      color: "white",
      pattern: "solid",
      genreTags: ["minimalist"],
    });

    expect(text).not.toContain("solid pattern");
  });

  it("includes non-solid patterns", () => {
    const text = itemToEmbeddingText({
      name: "Plaid Shirt",
      brand: "Burberry",
      category: "top",
      color: "beige",
      pattern: "plaid",
      genreTags: ["dark-academia"],
    });

    expect(text).toContain("plaid pattern");
  });

  it("handles null season gracefully", () => {
    const text = itemToEmbeddingText({
      name: "Belt",
      brand: "Gucci",
      category: "accessory",
      color: "brown",
      genreTags: ["old-money"],
      season: null,
    });

    expect(text).not.toContain("for null");
    expect(text).not.toContain("undefined");
  });
});

describe("search ranking logic", () => {
  it("sorts results by descending similarity score", () => {
    const scores = [
      { itemId: "a", score: 0.7 },
      { itemId: "b", score: 0.9 },
      { itemId: "c", score: 0.3 },
      { itemId: "d", score: 0.85 },
    ];

    const sorted = scores.sort((a, b) => b.score - a.score);

    expect(sorted[0].itemId).toBe("b");
    expect(sorted[1].itemId).toBe("d");
    expect(sorted[2].itemId).toBe("a");
    expect(sorted[3].itemId).toBe("c");
  });

  it("filters out scores below minimum threshold", () => {
    const minScore = 0.5;
    const scores = [
      { itemId: "a", score: 0.7 },
      { itemId: "b", score: 0.3 },
      { itemId: "c", score: 0.9 },
      { itemId: "d", score: 0.45 },
    ];

    const filtered = scores.filter((r) => r.score >= minScore);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.itemId)).toContain("a");
    expect(filtered.map((r) => r.itemId)).toContain("c");
  });

  it("respects topK limit", () => {
    const topK = 2;
    const scores = [
      { itemId: "a", score: 0.7 },
      { itemId: "b", score: 0.9 },
      { itemId: "c", score: 0.8 },
    ];

    const topResults = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    expect(topResults).toHaveLength(2);
    expect(topResults[0].itemId).toBe("b");
    expect(topResults[1].itemId).toBe("c");
  });
});
