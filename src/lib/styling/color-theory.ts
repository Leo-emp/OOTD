// Professional 12-season color analysis system
// Based on the color theory framework used by certified image consultants
// Maps skin undertone + contrast level → seasonal type → flattering colors
// This is the same system behind House of Colour, Color Me Beautiful, and Sci\ART

// ─── Undertone ──────────────────────────────────────
// Warm = yellow/golden undertone (veins look green, gold jewelry flatters)
// Cool = blue/pink undertone (veins look purple/blue, silver jewelry flatters)
// Neutral = mix of both (both metals flatter equally)
export type Undertone = "warm" | "cool" | "neutral";

// ─── Contrast level ─────────────────────────────────
// Difference between skin, hair, and eye color
// High = dark hair + light skin (or vice versa), vivid eyes
// Medium = moderate difference between features
// Low = similar tone across skin, hair, eyes (e.g. blonde + fair + light eyes)
export type ContrastLevel = "high" | "medium" | "low";

// ─── Skin depth ─────────────────────────────────────
export type SkinDepth = "fair" | "light" | "medium" | "olive" | "tan" | "deep";

// ─── Hair color (for contrast calculation) ──────────
export type HairColor =
  | "black" | "dark_brown" | "medium_brown" | "light_brown"
  | "dark_blonde" | "medium_blonde" | "light_blonde" | "red"
  | "auburn" | "grey" | "white";

// ─── Eye color (for accent color matching) ──────────
export type EyeColor = "brown" | "hazel" | "green" | "blue" | "grey" | "amber" | "black";

// ─── Color profile input ────────────────────────────
export interface ColorProfile {
  skinDepth: SkinDepth;
  undertone: Undertone;
  hairColor: HairColor;
  eyeColor: EyeColor;
}

// ─── 12-Season Types ────────────────────────────────
// Each season is a combination of undertone + depth + contrast
export type SeasonType =
  | "light_spring" | "warm_spring" | "clear_spring"
  | "light_summer" | "cool_summer" | "soft_summer"
  | "soft_autumn" | "warm_autumn" | "deep_autumn"
  | "clear_winter" | "cool_winter" | "deep_winter";

interface SeasonProfile {
  label: string;
  description: string;
  // Colors that make the person glow
  bestColors: string[];
  // Colors that wash out or clash
  worstColors: string[];
  // Metals that flatter
  bestMetals: string[];
  // Print/pattern scale (small, medium, large)
  patternScale: string;
  // Overall color intensity
  intensity: string;
}

// ─── Full 12-season color system ────────────────────
const SEASONS: Record<SeasonType, SeasonProfile> = {
  // ── SPRING (warm undertone, light-to-medium depth) ──
  light_spring: {
    label: "Light Spring",
    description: "Warm, delicate, and luminous — like early morning sunlight",
    bestColors: ["peach", "coral", "light_aqua", "warm_pink", "camel", "golden_yellow", "soft_green", "ivory", "light_turquoise", "apricot", "buff", "warm_beige"],
    worstColors: ["black", "charcoal", "burgundy", "navy", "dark_brown", "cool_grey", "magenta"],
    bestMetals: ["gold", "rose_gold"],
    patternScale: "small to medium, delicate prints",
    intensity: "light and warm — avoid anything too dark or heavy",
  },
  warm_spring: {
    label: "Warm Spring",
    description: "Rich warmth with golden undertones — sunshine incarnate",
    bestColors: ["golden_yellow", "warm_orange", "coral", "teal", "olive", "tomato_red", "warm_green", "camel", "cream", "turquoise", "amber", "warm_brown"],
    worstColors: ["pastel_pink", "cool_grey", "lavender", "fuchsia", "icy_blue", "black"],
    bestMetals: ["gold", "brass", "copper"],
    patternScale: "medium to large, warm-toned prints",
    intensity: "medium-high — rich, saturated warm tones",
  },
  clear_spring: {
    label: "Clear Spring",
    description: "Bright and vivid with warm undertones — electric and fresh",
    bestColors: ["bright_coral", "vivid_blue", "warm_red", "emerald", "bright_orange", "hot_turquoise", "ivory", "bright_yellow", "true_green", "cobalt", "warm_pink", "clear_navy"],
    worstColors: ["dusty_rose", "muted_tones", "olive_drab", "cool_grey", "mauve", "taupe"],
    bestMetals: ["gold", "bright_silver"],
    patternScale: "medium, high-contrast prints",
    intensity: "high — clear, vivid, saturated colors with contrast",
  },

  // ── SUMMER (cool undertone, light-to-medium depth) ──
  light_summer: {
    label: "Light Summer",
    description: "Soft and cool like a misty morning — gentle and ethereal",
    bestColors: ["powder_blue", "soft_pink", "lavender", "light_grey", "rose", "periwinkle", "soft_teal", "dusty_blue", "mauve", "sage", "cocoa", "soft_white"],
    worstColors: ["orange", "bright_yellow", "black", "tomato_red", "olive", "warm_brown"],
    bestMetals: ["silver", "white_gold", "platinum"],
    patternScale: "small, delicate, watercolor-like",
    intensity: "low-medium — soft, muted, cool pastels",
  },
  cool_summer: {
    label: "Cool Summer",
    description: "Distinctly cool with blue-pink undertones — elegant and refined",
    bestColors: ["blue_grey", "raspberry", "soft_navy", "lavender", "burgundy", "teal", "plum", "rose", "soft_white", "pewter", "icy_pink", "steel_blue"],
    worstColors: ["orange", "warm_brown", "golden_yellow", "olive", "peach", "camel"],
    bestMetals: ["silver", "platinum", "white_gold"],
    patternScale: "small to medium, cool-toned",
    intensity: "medium — cool, clear but not overpowering",
  },
  soft_summer: {
    label: "Soft Summer",
    description: "Muted and dusty like a watercolor painting — understated elegance",
    bestColors: ["dusty_rose", "soft_blue", "sage_green", "mauve", "light_plum", "dove_grey", "cocoa", "soft_teal", "rose_brown", "blue_grey", "soft_burgundy", "dusty_lavender"],
    worstColors: ["bright_orange", "vivid_red", "neon", "black", "bright_yellow", "electric_blue"],
    bestMetals: ["brushed_silver", "rose_gold", "antique_gold"],
    patternScale: "medium, blended and muted",
    intensity: "low — muted, greyed-out, dusty tones",
  },

  // ── AUTUMN (warm undertone, medium-to-deep depth) ──
  soft_autumn: {
    label: "Soft Autumn",
    description: "Warm and muted like early fall — earthy and gentle",
    bestColors: ["camel", "olive", "warm_grey", "terracotta", "soft_gold", "moss", "warm_beige", "dusty_orange", "sage", "warm_brown", "soft_coral", "muted_teal"],
    worstColors: ["bright_pink", "electric_blue", "neon", "black", "icy_pastels", "vivid_red"],
    bestMetals: ["antique_gold", "bronze", "brushed_copper"],
    patternScale: "medium, earthy blended prints",
    intensity: "low-medium — warm but muted, never harsh",
  },
  warm_autumn: {
    label: "Warm Autumn",
    description: "Rich and golden like harvest season — deep warmth",
    bestColors: ["burnt_orange", "olive", "warm_brown", "terracotta", "golden_yellow", "teal", "warm_red", "forest_green", "bronze", "rust", "camel", "deep_coral"],
    worstColors: ["pastel_pink", "icy_blue", "cool_grey", "lavender", "fuchsia", "black"],
    bestMetals: ["gold", "bronze", "copper"],
    patternScale: "medium to large, rich warm patterns",
    intensity: "medium-high — rich, earthy, saturated warm tones",
  },
  deep_autumn: {
    label: "Deep Autumn",
    description: "Dark and warm like spiced wine — luxurious depth",
    bestColors: ["dark_chocolate", "olive", "deep_teal", "burgundy", "burnt_orange", "forest_green", "warm_red", "bronze", "cognac", "espresso", "rust", "dark_gold"],
    worstColors: ["pastel_pink", "baby_blue", "lavender", "light_grey", "icy_tones", "bright_neon"],
    bestMetals: ["gold", "bronze", "antique_brass"],
    patternScale: "medium to large, deep rich prints",
    intensity: "high — deep, rich, warm and dark",
  },

  // ── WINTER (cool undertone, medium-to-deep depth) ──
  clear_winter: {
    label: "Clear Winter",
    description: "High contrast and vivid — dramatic and striking",
    bestColors: ["true_red", "cobalt_blue", "emerald", "black", "pure_white", "hot_pink", "bright_navy", "icy_blue", "vivid_purple", "true_green", "lemon_yellow", "bright_teal"],
    worstColors: ["muted_tones", "dusty_rose", "olive", "warm_brown", "camel", "rust"],
    bestMetals: ["silver", "platinum", "white_gold"],
    patternScale: "medium to large, high-contrast graphic",
    intensity: "very high — bold, clear, saturated with strong contrast",
  },
  cool_winter: {
    label: "Cool Winter",
    description: "Icy and sophisticated — think fresh snow under moonlight",
    bestColors: ["navy", "burgundy", "charcoal", "icy_pink", "cobalt", "emerald", "black", "pure_white", "raspberry", "royal_purple", "steel_blue", "true_red"],
    worstColors: ["orange", "warm_brown", "golden_yellow", "peach", "olive", "camel"],
    bestMetals: ["silver", "platinum", "gunmetal"],
    patternScale: "medium, cool-toned with contrast",
    intensity: "high — cool, saturated, dramatic",
  },
  deep_winter: {
    label: "Deep Winter",
    description: "Dark and powerful like midnight — commanding presence",
    bestColors: ["black", "dark_navy", "deep_purple", "true_red", "emerald", "charcoal", "dark_teal", "burgundy", "pure_white", "cobalt", "dark_olive", "icy_blue"],
    worstColors: ["pastels", "warm_beige", "light_grey", "peach", "golden_yellow", "dusty_pink"],
    bestMetals: ["silver", "gunmetal", "platinum"],
    patternScale: "bold, large-scale, dramatic",
    intensity: "very high — deep, dark, powerful tones",
  },
};

// ─── Determine season from color profile ────────────
// Uses skin depth + undertone + calculated contrast to find the best match
export function determineSeason(profile: ColorProfile): SeasonType {
  const contrast = calculateContrast(profile.skinDepth, profile.hairColor);

  if (profile.undertone === "warm" || profile.undertone === "neutral") {
    // WARM — Spring or Autumn
    if (profile.skinDepth === "fair" || profile.skinDepth === "light") {
      // Light skin + warm = Spring
      if (contrast === "high") return "clear_spring";
      if (contrast === "low") return "light_spring";
      return "warm_spring";
    } else {
      // Medium-to-deep skin + warm = Autumn
      if (contrast === "high") return "deep_autumn";
      if (contrast === "low") return "soft_autumn";
      return "warm_autumn";
    }
  } else {
    // COOL — Summer or Winter
    if (profile.skinDepth === "fair" || profile.skinDepth === "light") {
      // Light skin + cool = Summer
      if (contrast === "high") return "cool_summer";
      if (contrast === "low") return "light_summer";
      return "soft_summer";
    } else {
      // Medium-to-deep skin + cool = Winter
      if (contrast === "high") return "clear_winter";
      if (contrast === "low") return "deep_winter";
      return "cool_winter";
    }
  }
}

// ─── Calculate contrast from skin + hair ────────────
function calculateContrast(skin: SkinDepth, hair: HairColor): ContrastLevel {
  // Assign depth values: 1 = lightest, 6 = darkest
  const skinDepths: Record<SkinDepth, number> = {
    fair: 1, light: 2, medium: 3, olive: 3.5, tan: 4, deep: 5,
  };
  const hairDepths: Record<HairColor, number> = {
    white: 0.5, light_blonde: 1, medium_blonde: 1.5, dark_blonde: 2,
    light_brown: 2.5, red: 3, auburn: 3.5, medium_brown: 3.5,
    dark_brown: 4.5, grey: 2, black: 6,
  };

  const diff = Math.abs(skinDepths[skin] - hairDepths[hair]);
  if (diff >= 3) return "high";
  if (diff >= 1.5) return "medium";
  return "low";
}

// ─── Build the color-aware prompt section ───────────
// Returns a block of text to inject into the AI outfit prompt
export function buildColorPromptSection(profile: ColorProfile): string {
  const season = determineSeason(profile);
  const seasonData = SEASONS[season];

  return `COLOR ANALYSIS (personalized to this user's coloring):
Season type: ${seasonData.label} — ${seasonData.description}

FLATTERING COLORS (prioritize these): ${seasonData.bestColors.join(", ")}
UNFLATTERING COLORS (avoid when possible): ${seasonData.worstColors.join(", ")}
BEST METALS for jewelry/accessories: ${seasonData.bestMetals.join(", ")}
PATTERN SCALE: ${seasonData.patternScale}
COLOR INTENSITY: ${seasonData.intensity}

When the genre palette conflicts with this user's seasonal colors, prefer items from the genre palette that overlap with or are close to the flattering list. Never force an unflattering color just because the genre allows it.`;
}

// ─── Get full season data (for UI display) ──────────
export function getSeasonData(profile: ColorProfile): { season: SeasonType; data: SeasonProfile } {
  const season = determineSeason(profile);
  return { season, data: SEASONS[season] };
}

// ─── Self-assessment helpers for the onboarding flow ─
export const UNDERTONE_GUIDE = {
  warm: {
    label: "Warm",
    test: "Your veins look greenish. Gold jewelry flatters you more than silver. You tan easily. Earthy tones (olive, camel, rust) look natural on you.",
  },
  cool: {
    label: "Cool",
    test: "Your veins look blue/purple. Silver jewelry flatters you more than gold. You burn before tanning. Jewel tones (sapphire, ruby, emerald) look natural on you.",
  },
  neutral: {
    label: "Neutral",
    test: "Your veins look blue-green. Both gold and silver jewelry look equally good. You can wear both warm and cool colors without looking washed out.",
  },
};
