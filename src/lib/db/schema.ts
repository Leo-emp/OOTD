import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────
// Core user account — minimal, auth-related fields only
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Style Profiles ──────────────────────────────────
// Quiz results + learned preferences — one per user
export const styleProfiles = sqliteTable("style_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Genre breakdown from quiz (percentages)
  primaryGenre: text("primary_genre").notNull(),
  secondaryGenre: text("secondary_genre"),
  accentGenre: text("accent_genre"),
  // User attributes
  bodyType: text("body_type"),
  budgetMin: integer("budget_min").default(0),
  budgetMax: integer("budget_max").default(200),
  lifestyle: text("lifestyle"), // "student" | "office" | "creative" | "casual"
  colorPreferences: text("color_preferences", { mode: "json" }).$type<string[]>(),
  // Active genre — what they're currently browsing as
  activeGenre: text("active_genre").notNull(),
  // Context switching — different genres for different occasions
  workGenre: text("work_genre"),
  weekendGenre: text("weekend_genre"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Genre Rulesets ──────────────────────────────────
// DB-driven genre definitions — add new genre = insert row, zero code changes
export const genreRulesets = sqliteTable("genre_rulesets", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  // All rules stored as JSON — flexible, no schema migration needed
  colorRules: text("color_rules", { mode: "json" }).$type<{
    palette: string[];
    maxColorsPerOutfit: number;
    forbiddenColors: string[];
  }>().notNull(),
  fitRules: text("fit_rules", { mode: "json" }).$type<{
    silhouette: string;
    forbiddenFits: string[];
    logoVisibility: string;
  }>().notNull(),
  mustHave: text("must_have", { mode: "json" }).$type<string[]>().notNull(),
  forbidden: text("forbidden", { mode: "json" }).$type<string[]>().notNull(),
  occasionModifiers: text("occasion_modifiers", { mode: "json" }).$type<Record<string, string>>().notNull(),
  priceRange: text("price_range", { mode: "json" }).$type<{ min: number; max: number }>().notNull(),
  referenceBrands: text("reference_brands", { mode: "json" }).$type<string[]>().notNull(),
  // Display
  moodImageUrl: text("mood_image_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Wardrobe Items ──────────────────────────────────
// User-uploaded clothing with AI classification
export const wardrobeItems = sqliteTable("wardrobe_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Image variants — three sizes for responsive display
  imageUrl: text("image_url").notNull(), // original upload
  imageThumbUrl: text("image_thumb_url"), // 400px — wardrobe grid
  imageProcessedUrl: text("image_processed_url"), // bg-removed PNG
  // AI-classified attributes
  category: text("category"), // "top" | "bottom" | "shoes" | "accessory" | "outerwear" | "bag"
  color: text("color"),
  pattern: text("pattern"),
  genreTags: text("genre_tags", { mode: "json" }).$type<string[]>(),
  season: text("season"), // "spring" | "summer" | "fall" | "winter" | "all"
  // Processing state — optimistic UI shows item immediately, background job processes
  status: text("status").default("processing"), // "processing" | "ready" | "rejected"
  rejectionReason: text("rejection_reason"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Catalog Items ───────────────────────────────────
// Fashion products from ShopStyle Collective (25M+ items)
export const catalogItems = sqliteTable("catalog_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  price: real("price").notNull(),
  currency: text("currency").default("USD"),
  imageUrls: text("image_urls", { mode: "json" }).$type<string[]>().notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
  pattern: text("pattern"),
  genreTags: text("genre_tags", { mode: "json" }).$type<string[]>().notNull(),
  season: text("season"),
  affiliateUrl: text("affiliate_url").notNull(),
  // Inventory tracking
  inStock: integer("in_stock", { mode: "boolean" }).default(true),
  lastSynced: text("last_synced").default(sql`(datetime('now'))`),
  // Source tracking
  source: text("source").notNull(), // "shopstyle" | "demo"
  externalId: text("external_id").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Catalog Embeddings ──────────────────────────────
// Vector index for similarity search (sqlite-vec at launch, Qdrant at 5K+ users)
export const catalogEmbeddings = sqliteTable("catalog_embeddings", {
  itemId: text("item_id")
    .primaryKey()
    .references(() => catalogItems.id, { onDelete: "cascade" }),
  embedding: text("embedding").notNull(), // 768-dim float array as JSON string
});

// ─── Outfits ─────────────────────────────────────────
// Generated outfit combinations — each outfit has 4-6 items
export const outfits = sqliteTable("outfits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  genreId: text("genre_id")
    .notNull()
    .references(() => genreRulesets.id),
  occasion: text("occasion"), // "casual" | "formal" | "date" | "work" | "party"
  weather: text("weather"), // "hot" | "warm" | "cool" | "cold"
  styleExplanation: text("style_explanation"), // AI-generated styling notes
  source: text("source").notNull(), // "ai" | "pre-generated" | "cached" | "editors-pick"
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Outfit Items (junction) ─────────────────────────
// Links outfits to their component items (catalog or wardrobe)
export const outfitItems = sqliteTable("outfit_items", {
  id: text("id").primaryKey(),
  outfitId: text("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  itemType: text("item_type").notNull(), // "catalog" | "wardrobe"
  position: text("position").notNull(), // "top" | "bottom" | "shoes" | "accessory" | "outerwear" | "bag"
});

// ─── Outfit Ratings ──────────────────────────────────
// User feedback — love/skip/hate trains the preference model
export const outfitRatings = sqliteTable("outfit_ratings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  outfitId: text("outfit_id")
    .notNull()
    .references(() => outfits.id, { onDelete: "cascade" }),
  rating: text("rating").notNull(), // "love" | "skip" | "hate"
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── User Preferences (Learned) ──────────────────────
// Behavioral data derived from ratings — code-based scoring, not LLM
export const userPreferencesLearned = sqliteTable("user_preferences_learned", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredColors: text("preferred_colors", { mode: "json" }).$type<string[]>(),
  preferredBrands: text("preferred_brands", { mode: "json" }).$type<string[]>(),
  priceSweetSpot: real("price_sweet_spot"),
  styleVector: text("style_vector", { mode: "json" }).$type<number[]>(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Chat History ────────────────────────────────────
// Personal stylist conversation memory (last 20 messages in Redis, full history in DB)
export const chatHistory = sqliteTable("chat_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  message: text("message").notNull(),
  contextGenre: text("context_genre"),
  imageUrl: text("image_url"), // if user uploaded a photo for analysis
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Subscriptions ───────────────────────────────────
// Stripe billing state — free or pro ($24.99/mo, $199/yr)
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"), // "free" | "pro"
  status: text("status").notNull().default("active"), // "active" | "canceled" | "past_due"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Pinterest Connections ───────────────────────────
// OAuth tokens for Pinterest integration (Vibe Match, Shop the Pin)
export const pinterestConnections = sqliteTable("pinterest_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  connectedAt: text("connected_at").default(sql`(datetime('now'))`),
});

// ─── Pre-Generated Outfits ──────────────────────────
// Nightly cron batch results — 10 outfits per active user for instant morning display
export const preGeneratedOutfits = sqliteTable("pre_generated_outfits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  genreId: text("genre_id")
    .notNull()
    .references(() => genreRulesets.id),
  weatherDate: text("weather_date").notNull(), // "2026-08-11"
  outfitsJson: text("outfits_json", { mode: "json" }).notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
