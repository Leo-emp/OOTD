export { GENRES, GENRE_SLUGS, type GenreSlug } from "./genres";

// Pricing — single source of truth, referenced in profile + landing + settings
export const PRICING = {
  pro: { monthly: 24.99, yearly: 199 },
  currency: "USD",
} as const;

// AI model — used in gemini.ts + pinterest/vibe-match.ts
export const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";

// Image constraints
export const MAX_UPLOAD_SIZE_MB = 5;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

// Genre accent hex colors — used across quiz, pinterest, genres pages
export const GENRE_COLORS: Record<string, string> = {
  "old-money": "#C9B99A",
  "y2k": "#FF69B4",
  "streetwear": "#FF4D4D",
  "minimalist": "#94A3B8",
  "cottagecore": "#86EFAC",
  "dark-academia": "#8B7355",
  "coastal-grandma": "#87CEEB",
  "grunge": "#696969",
  "coquette": "#FFB6C1",
  "gorpcore": "#556B2F",
  "clean-girl": "#D4A574",
  "indie-boho": "#CD853F",
} as const;
