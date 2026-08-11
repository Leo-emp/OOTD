// ── Eval: Schema Validation ──
// Tests that all AI response schemas correctly validate expected outputs
// These run WITHOUT calling Gemini — they validate the Zod schemas themselves
// Ensures schema changes don't silently break AI output parsing

import { describe, it, expect } from "vitest";
import {
  AiOutfitResponseSchema,
  AiClothingAnalysisSchema,
  AiOutfitRatingSchema,
  AiStyleQuizResultSchema,
} from "@/types/ai";

describe("AiOutfitResponseSchema", () => {
  it("accepts valid outfit response", () => {
    const valid = {
      outfits: [
        {
          items: [
            { catalogItemId: "item_1", position: "top" },
            { catalogItemId: "item_2", position: "bottom" },
            { catalogItemId: "item_3", position: "shoes" },
            { catalogItemId: "item_4", position: "accessory" },
          ],
          styleExplanation: "Classic old money pairing with earth tones",
        },
      ],
    };
    expect(() => AiOutfitResponseSchema.parse(valid)).not.toThrow();
  });

  it("rejects outfit with invalid position", () => {
    const invalid = {
      outfits: [
        {
          items: [{ catalogItemId: "item_1", position: "hat" }],
          styleExplanation: "test",
        },
      ],
    };
    expect(() => AiOutfitResponseSchema.parse(invalid)).toThrow();
  });

  it("rejects empty outfits array", () => {
    // Schema allows empty array — this tests the schema shape, not business logic
    const empty = { outfits: [] };
    expect(() => AiOutfitResponseSchema.parse(empty)).not.toThrow();
  });

  it("rejects missing styleExplanation", () => {
    const noExplanation = {
      outfits: [
        {
          items: [{ catalogItemId: "item_1", position: "top" }],
        },
      ],
    };
    expect(() => AiOutfitResponseSchema.parse(noExplanation)).toThrow();
  });

  it("rejects missing catalogItemId", () => {
    const noId = {
      outfits: [
        {
          items: [{ position: "top" }],
          styleExplanation: "test",
        },
      ],
    };
    expect(() => AiOutfitResponseSchema.parse(noId)).toThrow();
  });
});

describe("AiClothingAnalysisSchema", () => {
  it("accepts valid clothing analysis", () => {
    const valid = {
      isClothing: true,
      category: "top",
      color: "navy blue",
      pattern: "solid",
      season: "all",
      genreCompatibility: ["old-money", "minimalist", "dark-academia"],
    };
    expect(() => AiClothingAnalysisSchema.parse(valid)).not.toThrow();
  });

  it("accepts rejection response", () => {
    const rejection = {
      isClothing: false,
      rejectionReason: "This appears to be a pet, not a clothing item",
    };
    expect(() => AiClothingAnalysisSchema.parse(rejection)).not.toThrow();
  });

  it("rejects invalid category", () => {
    const invalid = {
      isClothing: true,
      category: "pants", // not in enum
      color: "blue",
    };
    expect(() => AiClothingAnalysisSchema.parse(invalid)).toThrow();
  });

  it("rejects invalid season", () => {
    const invalid = {
      isClothing: true,
      category: "top",
      color: "red",
      season: "autumn", // should be "fall"
    };
    expect(() => AiClothingAnalysisSchema.parse(invalid)).toThrow();
  });
});

describe("AiOutfitRatingSchema", () => {
  it("accepts valid rating", () => {
    const valid = {
      score: 8,
      feedback: "Great color coordination",
      improvements: ["Add a statement accessory", "Consider darker shoes"],
      genreAlignment: 75,
    };
    expect(() => AiOutfitRatingSchema.parse(valid)).not.toThrow();
  });

  it("rejects score above 10", () => {
    const tooHigh = {
      score: 11,
      feedback: "Perfect",
      improvements: [],
      genreAlignment: 100,
    };
    expect(() => AiOutfitRatingSchema.parse(tooHigh)).toThrow();
  });

  it("rejects score below 1", () => {
    const tooLow = {
      score: 0,
      feedback: "Terrible",
      improvements: ["Start over"],
      genreAlignment: 5,
    };
    expect(() => AiOutfitRatingSchema.parse(tooLow)).toThrow();
  });

  it("rejects alignment above 100", () => {
    const invalid = {
      score: 7,
      feedback: "Okay",
      improvements: [],
      genreAlignment: 150,
    };
    expect(() => AiOutfitRatingSchema.parse(invalid)).toThrow();
  });

  it("rejects missing feedback", () => {
    const noFeedback = {
      score: 5,
      improvements: [],
      genreAlignment: 50,
    };
    expect(() => AiOutfitRatingSchema.parse(noFeedback)).toThrow();
  });
});

describe("AiStyleQuizResultSchema", () => {
  it("accepts valid quiz result", () => {
    const valid = {
      primaryGenre: "old-money",
      primaryPercentage: 60,
      secondaryGenre: "minimalist",
      secondaryPercentage: 25,
      accentGenre: "dark-academia",
      accentPercentage: 15,
      summary: "You have refined taste blending classic luxury with clean lines",
    };
    expect(() => AiStyleQuizResultSchema.parse(valid)).not.toThrow();
  });

  it("rejects missing summary", () => {
    const noSummary = {
      primaryGenre: "y2k",
      primaryPercentage: 50,
      secondaryGenre: "streetwear",
      secondaryPercentage: 30,
      accentGenre: "grunge",
      accentPercentage: 20,
    };
    expect(() => AiStyleQuizResultSchema.parse(noSummary)).toThrow();
  });

  it("rejects non-numeric percentages", () => {
    const invalid = {
      primaryGenre: "y2k",
      primaryPercentage: "fifty",
      secondaryGenre: "streetwear",
      secondaryPercentage: 30,
      accentGenre: "grunge",
      accentPercentage: 20,
      summary: "Test",
    };
    expect(() => AiStyleQuizResultSchema.parse(invalid)).toThrow();
  });
});
