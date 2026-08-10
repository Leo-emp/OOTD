import { z } from "zod";

export const WardrobeItemStatusSchema = z.enum(["processing", "ready", "rejected"]);

export const WardrobeItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  imageThumbUrl: z.string().nullable(),
  imageProcessedUrl: z.string().nullable(),
  category: z.string().nullable(),
  color: z.string().nullable(),
  pattern: z.string().nullable(),
  genreTags: z.array(z.string()).nullable(),
  season: z.string().nullable(),
  status: WardrobeItemStatusSchema,
  rejectionReason: z.string().nullable(),
});
export type WardrobeItem = z.infer<typeof WardrobeItemSchema>;
