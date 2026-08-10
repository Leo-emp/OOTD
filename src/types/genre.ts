import { z } from "zod";

// Genre ruleset as returned from DB (JSON fields parsed)
export const GenreColorRulesSchema = z.object({
  palette: z.array(z.string()),
  maxColorsPerOutfit: z.number(),
  forbiddenColors: z.array(z.string()),
});

export const GenreFitRulesSchema = z.object({
  silhouette: z.string(),
  forbiddenFits: z.array(z.string()),
  logoVisibility: z.string(),
});

export const GenrePriceRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
});

export const GenreRulesetSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  colorRules: GenreColorRulesSchema,
  fitRules: GenreFitRulesSchema,
  mustHave: z.array(z.string()),
  forbidden: z.array(z.string()),
  occasionModifiers: z.record(z.string(), z.string()),
  priceRange: GenrePriceRangeSchema,
  referenceBrands: z.array(z.string()),
  moodImageUrl: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type GenreRuleset = z.infer<typeof GenreRulesetSchema>;
export type GenreColorRules = z.infer<typeof GenreColorRulesSchema>;
export type GenreFitRules = z.infer<typeof GenreFitRulesSchema>;
