import { z } from "zod";

// Positions a clothing item can occupy in an outfit
export const OutfitPositionSchema = z.enum([
  "top", "bottom", "shoes", "accessory", "outerwear", "bag",
]);
export type OutfitPosition = z.infer<typeof OutfitPositionSchema>;

export const OccasionSchema = z.enum([
  "casual", "formal", "date", "work", "party",
]);
export type Occasion = z.infer<typeof OccasionSchema>;

export const WeatherSchema = z.enum(["hot", "warm", "cool", "cold"]);
export type Weather = z.infer<typeof WeatherSchema>;

export const RatingSchema = z.enum(["love", "skip", "hate"]);
export type Rating = z.infer<typeof RatingSchema>;

// A single item within an outfit (catalog or wardrobe)
export const OutfitItemSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(["catalog", "wardrobe"]),
  position: OutfitPositionSchema,
  name: z.string(),
  brand: z.string().optional(),
  price: z.number().optional(),
  imageUrl: z.string(),
  affiliateUrl: z.string().optional(),
  color: z.string(),
});
export type OutfitItem = z.infer<typeof OutfitItemSchema>;

// A complete outfit — 4-6 items composed by AI
export const OutfitSchema = z.object({
  id: z.string(),
  genreSlug: z.string(),
  occasion: OccasionSchema,
  weather: WeatherSchema.optional(),
  items: z.array(OutfitItemSchema).min(3).max(6),
  styleExplanation: z.string(),
  totalPrice: z.number().optional(),
  source: z.enum(["ai", "pre-generated", "cached", "editors-pick"]),
});
export type Outfit = z.infer<typeof OutfitSchema>;
