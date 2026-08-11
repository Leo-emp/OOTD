// Single source of truth for all genre slugs and display names
// Used across landing, dashboard, discover, quiz, wardrobe, stylist, rate-my-outfit, and catalog search
export const GENRES = [
  { slug: "old-money", name: "Old Money" },
  { slug: "y2k", name: "Y2K" },
  { slug: "streetwear", name: "Streetwear" },
  { slug: "minimalist", name: "Minimalist" },
  { slug: "cottagecore", name: "Cottagecore" },
  { slug: "dark-academia", name: "Dark Academia" },
  { slug: "coastal-grandma", name: "Coastal Grandma" },
  { slug: "grunge", name: "Grunge" },
  { slug: "coquette", name: "Coquette" },
  { slug: "gorpcore", name: "Gorpcore" },
  { slug: "clean-girl", name: "Clean Girl" },
  { slug: "indie-boho", name: "Indie Boho" },
] as const;

export type GenreSlug = (typeof GENRES)[number]["slug"];

export const GENRE_SLUGS = GENRES.map((g) => g.slug);
