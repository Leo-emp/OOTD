import { db } from "./index";
import { genreRulesets } from "./schema";
import { nanoid } from "nanoid";

// All 12 launch genres with complete rulesets
// Each genre defines the AI's fashion rules — color theory, fit, required pieces, forbidden items
const GENRES = [
  {
    name: "Old Money",
    slug: "old-money",
    description: "Quiet luxury, tailored silhouettes, understated elegance",
    colorRules: {
      palette: ["beige", "navy", "cream", "burgundy", "forest_green", "white", "camel"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["neon_green", "hot_pink", "orange", "neon_yellow"],
    },
    fitRules: {
      silhouette: "tailored",
      forbiddenFits: ["oversized", "crop_top", "distressed"],
      logoVisibility: "none",
    },
    mustHave: ["blazer OR structured_coat OR knit_sweater"],
    forbidden: ["graphic_tees", "chunky_sneakers", "visible_branding", "ripped_jeans"],
    occasionModifiers: {
      casual: "polo + chinos + loafers",
      formal: "full suit + oxford shoes + minimal watch",
      date: "turtleneck + tailored trousers + minimal jewelry",
      work: "blazer + button-down + dress pants",
      party: "silk blouse + tailored pants + heels",
    },
    priceRange: { min: 50, max: 300 },
    referenceBrands: ["Ralph Lauren", "Loro Piana", "Massimo Dutti", "COS", "Theory"],
  },
  {
    name: "Y2K",
    slug: "y2k",
    description: "Early 2000s nostalgia, low-rise, metallics, butterfly motifs, bold colors",
    colorRules: {
      palette: ["pink", "baby_blue", "silver", "lilac", "white", "hot_pink"],
      maxColorsPerOutfit: 4,
      forbiddenColors: ["dark_brown", "olive"],
    },
    fitRules: {
      silhouette: "fitted_low",
      forbiddenFits: ["oversized_formal"],
      logoVisibility: "featured",
    },
    mustHave: ["baby_tee OR mini_skirt OR platform_shoes"],
    forbidden: ["formal_blazer", "oxford_shoes", "tweed"],
    occasionModifiers: {
      casual: "baby tee + low-rise jeans + platform sneakers",
      formal: "metallic halter + tailored pants + heeled boots",
      date: "mini dress + platform boots + statement earrings",
      work: "fitted top + low-rise trousers + kitten heels",
      party: "sequin top + mini skirt + platform boots + tinted sunglasses",
    },
    priceRange: { min: 20, max: 150 },
    referenceBrands: ["Juicy Couture", "Von Dutch", "Ed Hardy", "SHEIN", "Dolls Kill"],
  },
  {
    name: "Streetwear",
    slug: "streetwear",
    description: "Urban, oversized, layered, sneaker-centric, graphic-heavy",
    colorRules: {
      palette: ["black", "white", "earth_tones", "olive", "grey", "red"],
      maxColorsPerOutfit: 4,
      forbiddenColors: ["pastel_pink", "lavender"],
    },
    fitRules: {
      silhouette: "oversized_layered",
      forbiddenFits: ["skin_tight", "formal_tailored"],
      logoVisibility: "bold",
    },
    mustHave: ["sneakers OR hoodie OR graphic_tee"],
    forbidden: ["formal_blazer", "loafers", "pearl_jewelry", "turtleneck"],
    occasionModifiers: {
      casual: "graphic hoodie + cargo pants + Jordans",
      formal: "clean hoodie under blazer + tailored joggers + designer sneakers",
      date: "fitted graphic tee + jeans + clean sneakers + chain",
      work: "minimal hoodie + chinos + clean sneakers",
      party: "statement jacket + cargo pants + high-tops + cap",
    },
    priceRange: { min: 30, max: 250 },
    referenceBrands: ["Nike", "Supreme", "Stussy", "Off-White", "A Bathing Ape"],
  },
  {
    name: "Minimalist",
    slug: "minimalist",
    description: "Clean lines, neutral palette, less-is-more, architectural shapes",
    colorRules: {
      palette: ["black", "white", "grey", "camel", "beige", "navy"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["neon", "bright_red", "hot_pink", "orange"],
    },
    fitRules: {
      silhouette: "clean_structured",
      forbiddenFits: ["distressed", "oversized_baggy"],
      logoVisibility: "none",
    },
    mustHave: ["structured_piece OR clean_line_top"],
    forbidden: ["graphic_tees", "bold_patterns", "chunky_jewelry", "visible_branding"],
    occasionModifiers: {
      casual: "plain tee + straight trousers + minimal sneakers",
      formal: "structured coat + monochrome suit + pointed shoes",
      date: "knit top + tailored pants + simple jewelry",
      work: "button-down + tailored trousers + loafers",
      party: "black dress/suit + minimal gold jewelry + clean heels",
    },
    priceRange: { min: 40, max: 250 },
    referenceBrands: ["COS", "Uniqlo", "Everlane", "Arket", "Muji"],
  },
  {
    name: "Cottagecore",
    slug: "cottagecore",
    description: "Soft, rural romantic, vintage-inspired, nature-loving, handmade aesthetic",
    colorRules: {
      palette: ["sage", "cream", "dusty_rose", "brown", "lavender", "mustard"],
      maxColorsPerOutfit: 4,
      forbiddenColors: ["neon", "black", "silver", "metallic"],
    },
    fitRules: {
      silhouette: "flowing_romantic",
      forbiddenFits: ["skin_tight", "structured_formal"],
      logoVisibility: "none",
    },
    mustHave: ["floral_piece OR knit_cardigan OR linen_item"],
    forbidden: ["leather_jacket", "sneakers", "graphic_tees", "metallic_fabric"],
    occasionModifiers: {
      casual: "floral dress + knit cardigan + woven basket bag",
      formal: "lace blouse + long skirt + delicate jewelry",
      date: "prairie dress + straw hat + sandals",
      work: "blouse + corduroy skirt + loafers",
      party: "embroidered dress + flower crown + ballet flats",
    },
    priceRange: { min: 25, max: 150 },
    referenceBrands: ["Free People", "Doen", "Christy Dawn", "Reformation", "& Other Stories"],
  },
  {
    name: "Dark Academia",
    slug: "dark-academia",
    description: "Scholarly, gothic-lite, layered, vintage, intellectual aesthetic",
    colorRules: {
      palette: ["brown", "forest_green", "burgundy", "black", "cream", "tan"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["neon", "pink", "bright_blue"],
    },
    fitRules: {
      silhouette: "layered_scholarly",
      forbiddenFits: ["crop_top", "oversized_streetwear"],
      logoVisibility: "none",
    },
    mustHave: ["blazer OR turtleneck OR plaid_item"],
    forbidden: ["sneakers", "graphic_tees", "metallic_fabric", "crop_tops"],
    occasionModifiers: {
      casual: "turtleneck + tweed blazer + corduroy pants + oxford shoes",
      formal: "full suit + vest + tie + leather shoes",
      date: "knit sweater + plaid pants + leather boots + vintage watch",
      work: "blazer + button-down + tailored pants + loafers",
      party: "velvet blazer + dark trousers + dress shoes",
    },
    priceRange: { min: 35, max: 200 },
    referenceBrands: ["Ralph Lauren", "Barbour", "Brooks Brothers", "J.Crew", "Zara"],
  },
  {
    name: "Coastal Grandma",
    slug: "coastal-grandma",
    description: "Relaxed luxury, breezy, Nancy Meyers aesthetic, effortlessly chic",
    colorRules: {
      palette: ["white", "sand", "light_blue", "oatmeal", "linen", "soft_grey"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["neon", "black", "hot_pink", "metallic"],
    },
    fitRules: {
      silhouette: "relaxed_elegant",
      forbiddenFits: ["skin_tight", "oversized_streetwear"],
      logoVisibility: "none",
    },
    mustHave: ["linen_piece OR woven_hat OR neutral_knit"],
    forbidden: ["leather_jacket", "graphic_tees", "chunky_sneakers", "bold_patterns"],
    occasionModifiers: {
      casual: "linen pants + striped top + woven hat + sandals",
      formal: "cream blazer + wide-leg pants + pearl earrings",
      date: "flowy dress + cardigan + delicate gold jewelry",
      work: "linen blouse + tailored pants + loafers",
      party: "silk blouse + wide-leg pants + espadrilles",
    },
    priceRange: { min: 40, max: 200 },
    referenceBrands: ["Eileen Fisher", "J.Crew", "L.L.Bean", "Vince", "Mango"],
  },
  {
    name: "Grunge",
    slug: "grunge",
    description: "Raw, distressed, 90s rebellion, plaid, combat boots, anti-fashion",
    colorRules: {
      palette: ["black", "plaid_red", "washed_denim", "dark_green", "grey", "brown"],
      maxColorsPerOutfit: 4,
      forbiddenColors: ["pastel", "neon", "bright_pink"],
    },
    fitRules: {
      silhouette: "oversized_distressed",
      forbiddenFits: ["formal_tailored", "preppy"],
      logoVisibility: "band_logos",
    },
    mustHave: ["flannel OR combat_boots OR band_tee"],
    forbidden: ["blazer", "loafers", "pearl_jewelry", "clean_sneakers"],
    occasionModifiers: {
      casual: "flannel + ripped jeans + combat boots",
      formal: "black jeans + band tee under blazer + boots",
      date: "leather jacket + vintage tee + jeans + boots",
      work: "dark flannel + black jeans + clean boots",
      party: "ripped tights + mini skirt + band tee + leather jacket",
    },
    priceRange: { min: 20, max: 150 },
    referenceBrands: ["Dr. Martens", "Converse", "Levi's", "Carhartt", "Thrift stores"],
  },
  {
    name: "Coquette",
    slug: "coquette",
    description: "Hyper-feminine, bows, soft textures, lace, ballet-inspired, delicate",
    colorRules: {
      palette: ["pink", "white", "lavender", "blush", "cream", "baby_blue"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["black", "dark_brown", "olive", "neon"],
    },
    fitRules: {
      silhouette: "feminine_delicate",
      forbiddenFits: ["oversized", "distressed", "structured_masculine"],
      logoVisibility: "none",
    },
    mustHave: ["bow_detail OR lace_item OR ballet_flats"],
    forbidden: ["combat_boots", "graphic_tees", "cargo_pants", "leather_jacket"],
    occasionModifiers: {
      casual: "ribbon top + mini skirt + ballet flats + bow hair clip",
      formal: "lace dress + kitten heels + pearl earrings",
      date: "corset top + flowing skirt + strappy heels + ribbon choker",
      work: "blouse with bow detail + pencil skirt + flats",
      party: "mini dress + ribbon details + heels + dainty jewelry",
    },
    priceRange: { min: 20, max: 150 },
    referenceBrands: ["Reformation", "Rouje", "Sézane", "LoveShackFancy", "Zara"],
  },
  {
    name: "Gorpcore",
    slug: "gorpcore",
    description: "Outdoor technical meets urban, functional fashion, trail-to-city",
    colorRules: {
      palette: ["olive", "orange", "tan", "navy", "black", "forest_green"],
      maxColorsPerOutfit: 4,
      forbiddenColors: ["pastel_pink", "lavender", "metallic"],
    },
    fitRules: {
      silhouette: "functional_layered",
      forbiddenFits: ["formal_tailored", "skin_tight_dress"],
      logoVisibility: "brand_logos",
    },
    mustHave: ["puffer OR trail_shoes OR windbreaker OR fleece"],
    forbidden: ["heels", "silk", "lace", "formal_blazer"],
    occasionModifiers: {
      casual: "fleece + cargo pants + trail runners",
      formal: "clean puffer + chinos + hiking boots",
      date: "vest + flannel + jeans + clean trail shoes",
      work: "softshell jacket + technical pants + sneakers",
      party: "statement puffer + joggers + trail shoes",
    },
    priceRange: { min: 40, max: 300 },
    referenceBrands: ["Arc'teryx", "Salomon", "The North Face", "Patagonia", "Nike ACG"],
  },
  {
    name: "Clean Girl",
    slug: "clean-girl",
    description: "Polished effortless, 'no makeup makeup' of fashion, matching sets, gold accents",
    colorRules: {
      palette: ["neutral", "mocha", "white", "gold", "beige", "black"],
      maxColorsPerOutfit: 3,
      forbiddenColors: ["neon", "bright_red", "bold_patterns"],
    },
    fitRules: {
      silhouette: "fitted_polished",
      forbiddenFits: ["oversized_baggy", "distressed"],
      logoVisibility: "minimal",
    },
    mustHave: ["matching_set OR gold_hoops OR slicked_accessory"],
    forbidden: ["graphic_tees", "combat_boots", "chunky_jewelry", "bold_prints"],
    occasionModifiers: {
      casual: "matching set + clean sneakers + gold hoops + slicked bun",
      formal: "tailored co-ord + heels + minimal gold jewelry",
      date: "bodycon dress + gold accessories + strappy sandals",
      work: "blazer + matching trousers + pointed flats + gold watch",
      party: "satin matching set + heels + gold layered necklaces",
    },
    priceRange: { min: 30, max: 200 },
    referenceBrands: ["Zara", "Skims", "Aritzia", "Abercrombie", "Mejuri"],
  },
  {
    name: "Indie/Boho",
    slug: "indie-boho",
    description: "Free-spirited, eclectic, layered textures, earthy tones, artisan details",
    colorRules: {
      palette: ["mustard", "terracotta", "teal", "cream", "rust", "olive"],
      maxColorsPerOutfit: 5,
      forbiddenColors: ["neon", "metallic_silver", "hot_pink"],
    },
    fitRules: {
      silhouette: "flowing_layered",
      forbiddenFits: ["structured_formal", "skin_tight"],
      logoVisibility: "none",
    },
    mustHave: ["maxi_piece OR fringe_detail OR layered_necklaces"],
    forbidden: ["formal_blazer", "clean_sneakers", "minimalist_watch"],
    occasionModifiers: {
      casual: "maxi dress + fringe bag + layered necklaces + boots",
      formal: "embroidered dress + statement jewelry + heeled boots",
      date: "flowy top + wide-leg pants + artisan earrings + sandals",
      work: "printed blouse + wide-leg pants + boots",
      party: "sequin kimono + jeans + boots + layered jewelry",
    },
    priceRange: { min: 25, max: 180 },
    referenceBrands: ["Free People", "Anthropologie", "Urban Outfitters", "Spell", "Lack of Color"],
  },
];

// Seed function — idempotent (safe to run multiple times)
export async function seedGenres() {
  for (const genre of GENRES) {
    const existing = await db.query.genreRulesets.findFirst({
      where: (g, { eq }) => eq(g.slug, genre.slug),
    });

    if (!existing) {
      await db.insert(genreRulesets).values({
        id: nanoid(),
        name: genre.name,
        slug: genre.slug,
        description: genre.description,
        colorRules: genre.colorRules,
        fitRules: genre.fitRules,
        mustHave: genre.mustHave,
        forbidden: genre.forbidden,
        occasionModifiers: genre.occasionModifiers,
        priceRange: genre.priceRange,
        referenceBrands: genre.referenceBrands,
        sortOrder: GENRES.indexOf(genre),
      });
    }
  }

  console.log(`Seeded ${GENRES.length} genre rulesets`);
}

// Run directly: npx tsx src/lib/db/seed-genres.ts
if (require.main === module) {
  seedGenres()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Seed failed:", e);
      process.exit(1);
    });
}
