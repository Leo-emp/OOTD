import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
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
}, (t) => [
  index("wardrobe_user_idx").on(t.userId),
  index("wardrobe_user_category_idx").on(t.userId, t.category),
]);

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
}, (t) => [
  index("catalog_category_idx").on(t.category),
  index("catalog_brand_idx").on(t.brand),
  index("catalog_source_external_idx").on(t.source, t.externalId),
]);

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
}, (t) => [
  index("outfits_user_idx").on(t.userId),
  index("outfits_user_genre_idx").on(t.userId, t.genreId),
]);

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
}, (t) => [
  index("outfit_items_outfit_idx").on(t.outfitId),
  index("outfit_items_item_idx").on(t.itemId),
]);

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
}, (t) => [
  index("ratings_user_idx").on(t.userId),
  index("ratings_outfit_idx").on(t.outfitId),
]);

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
}, (t) => [
  index("chat_user_idx").on(t.userId),
  index("chat_user_genre_idx").on(t.userId, t.contextGenre),
]);

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
}, (t) => [
  index("subs_stripe_customer_idx").on(t.stripeCustomerId),
]);

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

// ─── Style Streaks ──────────────────────────────────
// Tracks daily outfit logging — gamification to drive daily opens
// Each row = one day the user logged what they wore
export const styleStreaks = sqliteTable("style_streaks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // "2026-08-11" — one entry per day max
  outfitId: text("outfit_id"), // optional link to the outfit they logged
  genreSlug: text("genre_slug"), // which genre they wore
  note: text("note"), // optional "how I felt" note
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("streaks_user_date_idx").on(t.userId, t.date),
  index("streaks_user_idx").on(t.userId),
]);

// ─── Style Snapshots ────────────────────────────────
// Monthly genre preference snapshot — powers the Style Evolution Timeline
// Cron captures genre breakdown from ratings/streaks at end of each month
export const styleSnapshots = sqliteTable("style_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // "2026-08" — one per month per user
  // Genre percentages as JSON — { "old-money": 45, "minimalist": 30, ... }
  genreBreakdown: text("genre_breakdown", { mode: "json" }).$type<Record<string, number>>().notNull(),
  // Summary stats for the month
  totalOutfits: integer("total_outfits").default(0),
  topGenre: text("top_genre").notNull(),
  avgRating: real("avg_rating"), // average outfit rating this month
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("snapshots_user_month_idx").on(t.userId, t.month),
]);

// ─── Challenges ─────────────────────────────────────
// Predefined style challenges — "5-day minimalist challenge", "weekend streetwear", etc.
export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  genreSlug: text("genre_slug").notNull(), // which genre this challenge focuses on
  durationDays: integer("duration_days").notNull(), // 3, 5, 7
  difficulty: text("difficulty").notNull(), // "easy" | "medium" | "hard"
  badgeEmoji: text("badge_emoji").notNull(), // emoji badge on completion e.g. "🎩"
  // Tips for each day as JSON array — ["Day 1: Start with...", "Day 2: Try..."]
  dailyTips: text("daily_tips", { mode: "json" }).$type<string[]>().notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Challenge Progress ─────────────────────────────
// Tracks a user's enrollment and daily progress in a challenge
export const challengeProgress = sqliteTable("challenge_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id")
    .notNull()
    .references(() => challenges.id),
  startDate: text("start_date").notNull(), // "2026-08-11"
  // Days completed as JSON array of dates — ["2026-08-11", "2026-08-12"]
  completedDays: text("completed_days", { mode: "json" }).$type<string[]>().default([]),
  status: text("status").notNull().default("active"), // "active" | "completed" | "abandoned"
  completedAt: text("completed_at"), // set when all days done
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("challenge_progress_user_idx").on(t.userId),
  index("challenge_progress_user_challenge_idx").on(t.userId, t.challengeId),
]);

// ─── Seasonal Audits ────────────────────────────────
// Cached quarterly wardrobe gap analysis results
// "You're missing 3 fall essentials for Old Money" — drives shopping
export const seasonalAudits = sqliteTable("seasonal_audits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  season: text("season").notNull(), // "fall-2026", "winter-2026"
  genreSlug: text("genre_slug").notNull(), // which genre was audited
  // AI analysis results as JSON
  missingItems: text("missing_items", { mode: "json" }).$type<{
    category: string;
    suggestion: string;
    priority: "essential" | "nice-to-have";
  }[]>().notNull(),
  score: integer("score").notNull(), // 0-100 wardrobe readiness score
  summary: text("summary").notNull(), // "Your Old Money fall wardrobe is 65% ready"
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("seasonal_user_season_idx").on(t.userId, t.season),
]);

// ─── Outfit Posts (Social Feed) ──────────────────────
// User-shared OOTD posts — the community feed backbone
export const outfitPosts = sqliteTable("outfit_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(), // outfit photo (Vercel Blob)
  caption: text("caption"), // optional text (max 500 chars)
  genreSlug: text("genre_slug").notNull(),
  outfitId: text("outfit_id"), // optional link to a saved/generated outfit
  // Denormalized counters — avoids COUNT queries on every feed load
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("posts_user_idx").on(t.userId),
  index("posts_genre_idx").on(t.genreSlug),
  index("posts_created_idx").on(t.createdAt),
]);

// ─── Post Likes ─────────────────────────────────────
export const postLikes = sqliteTable("post_likes", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => outfitPosts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("likes_post_idx").on(t.postId),
  index("likes_user_post_idx").on(t.userId, t.postId),
]);

// ─── Post Comments ──────────────────────────────────
export const postComments = sqliteTable("post_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => outfitPosts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("comments_post_idx").on(t.postId),
]);

// ─── Follows ────────────────────────────────────────
// Social graph — who follows whom
export const follows = sqliteTable("follows", {
  id: text("id").primaryKey(),
  followerId: text("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("follows_follower_idx").on(t.followerId),
  index("follows_following_idx").on(t.followingId),
]);

// ─── Taste Profiles ─────────────────────────────────
// Computed taste dimensions from all user interactions — the proprietary moat
// Re-computed periodically from ratings, streaks, engagement, and chat signals
export const tasteProfiles = sqliteTable("taste_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Weighted affinity maps — higher = stronger preference
  colorAffinities: text("color_affinities", { mode: "json" }).$type<Record<string, number>>(),
  brandAffinities: text("brand_affinities", { mode: "json" }).$type<Record<string, number>>(),
  genreWeights: text("genre_weights", { mode: "json" }).$type<Record<string, number>>(),
  // Price range derived from actual behavior (not self-reported)
  priceMin: real("price_min"),
  priceMax: real("price_max"),
  priceMean: real("price_mean"),
  // Style dimensions (0-1 scale) — axes of personal taste
  formalityCasual: real("formality_casual"), // 0=very formal, 1=very casual
  boldnessMinimal: real("boldness_minimal"), // 0=very bold, 1=very minimal
  trendClassic: real("trend_classic"), // 0=very trendy, 1=very classic
  // Confidence — more interactions = more reliable taste profile
  totalInteractions: integer("total_interactions").default(0),
  lastComputed: text("last_computed"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Shopping Recommendations ───────────────────────
// AI-generated "buy this to complete your wardrobe" suggestions
// Links catalog items to wardrobe items they pair with
export const shoppingRecommendations = sqliteTable("shopping_recommendations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  catalogItemId: text("catalog_item_id")
    .notNull()
    .references(() => catalogItems.id),
  reason: text("reason").notNull(), // "Completes 3 outfits in Old Money"
  matchScore: real("match_score").notNull(), // 0-100 relevance
  wardrobeItemIds: text("wardrobe_item_ids", { mode: "json" }).$type<string[]>(),
  genreSlug: text("genre_slug").notNull(),
  category: text("category").notNull(), // what category is missing
  status: text("status").default("active"), // "active" | "dismissed" | "purchased"
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (t) => [
  index("shop_recs_user_idx").on(t.userId),
  index("shop_recs_user_status_idx").on(t.userId, t.status),
]);

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
}, (t) => [
  index("pregen_user_date_idx").on(t.userId, t.weatherDate),
]);
