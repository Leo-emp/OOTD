// ShopStyle Collective API adapter — primary data source (25M+ products, 1000+ brands)
// Apply at: https://collective.shopstyle.com/ → get API key → set SHOPSTYLE_API_KEY env var
// Docs: https://collective.shopstyle.com/api (requires partner login)

import type { CatalogAdapter, NormalizedCatalogItem } from "./provider";

// ShopStyle API response types
interface ShopStyleProduct {
  id: number;
  name: string;
  brandedName: string;
  unbrandedName: string;
  brand: { id: number; name: string };
  retailer: { id: number; name: string };
  price: number;
  salePrice?: number;
  inStock: boolean;
  clickUrl: string; // affiliate-tracked link
  image: { id: string; sizes: Record<string, { url: string; width: number; height: number }> };
  alternateImages?: Array<{ id: string; sizes: Record<string, { url: string }> }>;
  colors?: Array<{ name: string; canonicalName: string }>;
  categories?: Array<{ id: string; name: string; shortName: string }>;
  description?: string;
}

interface ShopStyleSearchResponse {
  metadata: {
    total: number;
    offset: number;
    limit: number;
  };
  products: ShopStyleProduct[];
}

// Map our genre slugs to ShopStyle category + filter combos
// Each genre maps to multiple ShopStyle searches for comprehensive coverage
const GENRE_TO_SHOPSTYLE: Record<string, { categories: string[]; brands?: string[]; filters?: string[] }> = {
  "old-money": {
    categories: ["blazers", "polos", "dress-shirts", "chinos", "loafers", "cashmere-sweaters"],
    brands: ["Ralph Lauren", "Brooks Brothers", "Theory", "Massimo Dutti", "J.Crew"],
    filters: ["price:50:500"],
  },
  "y2k": {
    categories: ["crop-tops", "mini-skirts", "platform-shoes", "baby-tees", "low-rise-jeans"],
    brands: ["Juicy Couture", "SHEIN", "Dolls Kill", "PacSun"],
    filters: ["price:10:200"],
  },
  "streetwear": {
    categories: ["hoodies", "sneakers", "graphic-tees", "cargo-pants", "jackets"],
    brands: ["Nike", "Adidas", "Stussy", "Supreme", "New Balance"],
    filters: ["price:20:400"],
  },
  "minimalist": {
    categories: ["plain-tees", "trousers", "minimal-sneakers", "structured-coats"],
    brands: ["COS", "Everlane", "Uniqlo", "Arket", "& Other Stories"],
    filters: ["price:30:300"],
  },
  "cottagecore": {
    categories: ["floral-dresses", "cardigans", "linen-tops", "midi-skirts", "sandals"],
    brands: ["Free People", "Reformation", "Doen", "& Other Stories"],
    filters: ["price:20:200"],
  },
  "dark-academia": {
    categories: ["blazers", "turtlenecks", "oxford-shoes", "tweed", "vests"],
    brands: ["Ralph Lauren", "Brooks Brothers", "Barbour", "J.Crew"],
    filters: ["price:30:300"],
  },
  "coastal-grandma": {
    categories: ["linen-pants", "straw-hats", "espadrilles", "striped-tops", "wide-leg-pants"],
    brands: ["Eileen Fisher", "J.Crew", "Vince", "Mango", "L.L.Bean"],
    filters: ["price:30:250"],
  },
  "grunge": {
    categories: ["flannels", "combat-boots", "band-tees", "ripped-jeans", "leather-jackets"],
    brands: ["Dr. Martens", "Levi's", "Converse", "Carhartt"],
    filters: ["price:15:200"],
  },
  "coquette": {
    categories: ["ballet-flats", "lace-tops", "mini-dresses", "bows", "skirts"],
    brands: ["Reformation", "Sézane", "LoveShackFancy", "Rouje"],
    filters: ["price:20:250"],
  },
  "gorpcore": {
    categories: ["puffer-jackets", "trail-shoes", "fleece", "cargo-pants", "windbreakers"],
    brands: ["Arc'teryx", "Salomon", "The North Face", "Patagonia", "Nike ACG"],
    filters: ["price:30:400"],
  },
  "clean-girl": {
    categories: ["matching-sets", "bodycon", "gold-jewelry", "minimal-sneakers", "blazers"],
    brands: ["Zara", "Skims", "Aritzia", "Abercrombie", "Mejuri"],
    filters: ["price:20:250"],
  },
  "indie-boho": {
    categories: ["maxi-dresses", "wide-leg-pants", "fringe-bags", "boots", "printed-tops"],
    brands: ["Free People", "Anthropologie", "Spell", "Urban Outfitters"],
    filters: ["price:20:250"],
  },
};

// Map ShopStyle category strings to our 6 normalized categories
function normalizeCategory(shopStyleCategories: Array<{ name: string; shortName: string }>): string {
  const names = shopStyleCategories.map((c) => c.name.toLowerCase()).join(" ");

  if (names.match(/shoe|sneaker|boot|loafer|sandal|heel|flat|espadrille|slipper/)) return "shoes";
  if (names.match(/bag|purse|tote|clutch|backpack|crossbody/)) return "bag";
  if (names.match(/jacket|coat|puffer|blazer|outerwear|windbreaker|fleece|vest/)) return "outerwear";
  if (names.match(/pant|trouser|jean|short|skirt|legging|jogger|cargo/)) return "bottom";
  if (names.match(/necklace|bracelet|earring|ring|watch|sunglasses|hat|scarf|belt|jewelry|hoop/)) return "accessory";
  // Default to top for shirts, tees, blouses, sweaters, hoodies, etc.
  return "top";
}

// Extract primary color from ShopStyle color data
function normalizeColor(colors?: Array<{ name: string; canonicalName: string }>): string {
  if (!colors?.length) return "multi";
  return colors[0].canonicalName?.toLowerCase() || colors[0].name?.toLowerCase() || "multi";
}

// Pull the best quality image URL from ShopStyle's size variants
function extractImageUrls(product: ShopStyleProduct): string[] {
  const urls: string[] = [];

  // Main image — prefer "Large" then "IPhone" then "Original"
  const mainSizes = product.image?.sizes;
  if (mainSizes) {
    const preferred = mainSizes["Large"] || mainSizes["IPhone"] || mainSizes["Original"];
    if (preferred) urls.push(preferred.url);
  }

  // Alternate images (up to 4 more)
  if (product.alternateImages) {
    for (const alt of product.alternateImages.slice(0, 4)) {
      const altSizes = alt.sizes;
      const preferred = altSizes?.["Large"] || altSizes?.["IPhone"] || altSizes?.["Original"];
      if (preferred) urls.push(preferred.url);
    }
  }

  return urls;
}

// Convert ShopStyle product to our normalized format
function normalizeProduct(product: ShopStyleProduct, genreSlug: string): NormalizedCatalogItem {
  return {
    externalId: `shopstyle-${product.id}`,
    name: product.unbrandedName || product.name,
    brand: product.brand?.name || "Unknown",
    price: product.salePrice || product.price,
    currency: "USD",
    imageUrls: extractImageUrls(product),
    category: normalizeCategory(product.categories || []),
    color: normalizeColor(product.colors),
    season: "all", // ShopStyle doesn't provide season data — we'll infer later
    affiliateUrl: product.clickUrl,
  };
}

// ─── ShopStyle API Client ──────────────────────────────
export class ShopStyleAdapter implements CatalogAdapter {
  name = "shopstyle";
  private apiKey: string;
  private baseUrl = "https://api.shopstyle.com/api/v2";

  constructor() {
    // API key from env — will be undefined until user registers as ShopStyle partner
    this.apiKey = process.env.SHOPSTYLE_API_KEY || "";
  }

  // Check if the API is configured and ready to use
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  // Search ShopStyle's 25M+ product catalog
  async fetchProducts(params: {
    category?: string;
    genre?: string;
    limit?: number;
    offset?: number;
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
  }): Promise<NormalizedCatalogItem[]> {
    if (!this.isConfigured()) {
      // No API key — fall back to local DB catalog
      return [];
    }

    const { category, genre, limit = 50, offset = 0, minPrice, maxPrice, brands } = params;

    // Build query params for ShopStyle API
    const searchParams = new URLSearchParams({
      pid: this.apiKey,
      limit: String(Math.min(limit, 50)), // ShopStyle caps at 50 per request
      offset: String(offset),
    });

    // Category filter
    if (category) {
      searchParams.set("cat", category);
    }

    // Price range filter (ShopStyle format: "price:MIN:MAX")
    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice || 0;
      const max = maxPrice || 99999;
      searchParams.append("fl", `price:${min}:${max}`);
    }

    // Brand filter — each brand is a separate fl param
    if (brands?.length) {
      for (const brand of brands) {
        searchParams.append("fl", `b${brand.replace(/\s/g, "+")}`);
      }
    }

    // Sort by popularity (most relevant for outfit building)
    searchParams.set("sort", "Popular");

    try {
      const response = await fetch(`${this.baseUrl}/products?${searchParams.toString()}`, {
        // 10 second timeout to avoid blocking outfit generation
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "OOTD-AI/1.0" },
      });

      if (!response.ok) {
        console.error(`[ShopStyle] API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: ShopStyleSearchResponse = await response.json();
      const genreSlug = genre || "minimalist";

      return data.products
        .filter((p) => p.inStock) // Only in-stock items
        .map((p) => normalizeProduct(p, genreSlug));
    } catch (error) {
      console.error("[ShopStyle] Fetch failed:", error);
      return [];
    }
  }

  // Fetch products specifically for a genre (uses genre → ShopStyle mapping)
  async fetchByGenre(genreSlug: string, limit: number = 100): Promise<NormalizedCatalogItem[]> {
    const mapping = GENRE_TO_SHOPSTYLE[genreSlug];
    if (!mapping) return [];

    // Fetch from multiple categories in parallel for broader coverage
    const perCategory = Math.ceil(limit / mapping.categories.length);
    const promises = mapping.categories.map((cat) =>
      this.fetchProducts({
        category: cat,
        genre: genreSlug,
        limit: perCategory,
        brands: mapping.brands,
      })
    );

    const results = await Promise.allSettled(promises);
    const items = results
      .filter((r): r is PromiseFulfilledResult<NormalizedCatalogItem[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    // Deduplicate by externalId
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.externalId)) return false;
      seen.add(item.externalId);
      return true;
    });
  }

  // Check if specific products are still in stock
  async checkAvailability(externalIds: string[]): Promise<Map<string, boolean>> {
    const availability = new Map<string, boolean>();

    if (!this.isConfigured()) {
      // Without API key, assume all items are in stock
      for (const id of externalIds) availability.set(id, true);
      return availability;
    }

    // ShopStyle doesn't have a batch availability endpoint
    // Check individual products (rate-limited to 10 concurrent)
    const numericIds = externalIds
      .filter((id) => id.startsWith("shopstyle-"))
      .map((id) => ({ original: id, numeric: id.replace("shopstyle-", "") }));

    const batchSize = 10;
    for (let i = 0; i < numericIds.length; i += batchSize) {
      const batch = numericIds.slice(i, i + batchSize);
      const promises = batch.map(async ({ original, numeric }) => {
        try {
          const response = await fetch(
            `${this.baseUrl}/products/${numeric}?pid=${this.apiKey}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (response.ok) {
            const product: ShopStyleProduct = await response.json();
            availability.set(original, product.inStock);
          } else {
            availability.set(original, false);
          }
        } catch {
          availability.set(original, false);
        }
      });
      await Promise.allSettled(promises);
    }

    return availability;
  }
}

// Singleton — shared across all requests
export const shopStyleAdapter = new ShopStyleAdapter();
