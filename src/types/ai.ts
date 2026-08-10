import { z } from "zod";

// Schema for Gemini outfit composition response
// This is what we force Gemini to return via structured JSON output
export const AiOutfitResponseSchema = z.object({
  outfits: z.array(
    z.object({
      // Item IDs selected from the candidate pool
      items: z.array(
        z.object({
          catalogItemId: z.string(),
          position: z.enum(["top", "bottom", "shoes", "accessory", "outerwear", "bag"]),
        })
      ),
      // Why this combination works for the genre
      styleExplanation: z.string(),
    })
  ),
});
export type AiOutfitResponse = z.infer<typeof AiOutfitResponseSchema>;

// Schema for clothing image analysis (wardrobe upload)
export const AiClothingAnalysisSchema = z.object({
  isClothing: z.boolean(),
  category: z.enum(["top", "bottom", "shoes", "accessory", "outerwear", "bag"]).optional(),
  color: z.string().optional(),
  pattern: z.string().optional(),
  season: z.enum(["spring", "summer", "fall", "winter", "all"]).optional(),
  genreCompatibility: z.array(z.string()).optional(),
  rejectionReason: z.string().optional(),
});
export type AiClothingAnalysis = z.infer<typeof AiClothingAnalysisSchema>;

// Schema for outfit rating response (user uploads their outfit photo)
export const AiOutfitRatingSchema = z.object({
  score: z.number().min(1).max(10),
  feedback: z.string(),
  improvements: z.array(z.string()),
  genreAlignment: z.number().min(0).max(100),
});
export type AiOutfitRating = z.infer<typeof AiOutfitRatingSchema>;

// Schema for style quiz analysis
export const AiStyleQuizResultSchema = z.object({
  primaryGenre: z.string(),
  primaryPercentage: z.number(),
  secondaryGenre: z.string(),
  secondaryPercentage: z.number(),
  accentGenre: z.string(),
  accentPercentage: z.number(),
  summary: z.string(), // "You have a refined taste that blends..."
});
export type AiStyleQuizResult = z.infer<typeof AiStyleQuizResultSchema>;
