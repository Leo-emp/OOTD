# OOTD AI: Technical Report

## Problem Statement

Fashion recommendation is one of the hardest personalization problems in consumer AI. Unlike music or movies — where taste can be expressed as genre preferences — clothing exists at the intersection of aesthetics, body type, occasion, weather, budget, and cultural context. A recommendation that ignores any of these dimensions fails.

Three technical challenges make this harder than a standard recommendation engine:

1. **Multi-modal preference learning** — Users can't articulate their style in words. "I like minimalist but sometimes edgy" is meaningless to a system. Preferences must be learned implicitly from behavior: what they save, how long they look, what they skip.
2. **Combinatorial explosion** — An outfit is 4–6 items that must work together. With a catalog of 500+ items across 12 genres, the number of valid combinations exceeds what any ranking model can score exhaustively. The system needs compositional reasoning, not item-by-item ranking.
3. **Cold start** — A new user has no history. The system must produce good recommendations from the first interaction, then improve rapidly as data accumulates.

## Approach

### Agentic Outfit Pipeline

The core outfit generation uses a multi-step AI agent rather than a single prompt. Each step is a distinct tool that the agent calls in sequence:

**Step 1 — Analyze Wardrobe:** Fetch the user's wardrobe items from the database, categorize by type (tops, bottoms, shoes, accessories), and identify gaps (no formal shoes, no outerwear, etc.).

**Step 2 — Gap Detection:** Compare the wardrobe against the genre's requirements. If the user wants an Old Money outfit but owns no tailored trousers, the agent flags this and prioritizes catalog items that fill the gap.

**Step 3 — Semantic Search:** Use RAG embeddings to find catalog items that match the styling context. The query combines genre aesthetic, occasion, weather, and body type into a natural language search — "structured linen blazer in neutral tones for warm weather formal" — and retrieves the top-k semantically similar items.

**Step 4 — Outfit Generation:** With wardrobe items + relevant catalog items as the candidate pool, the AI generates 3–5 complete outfits. The prompt includes the genre's explicit rules (color palette, fit rules, forbidden items), body-type-specific silhouette recommendations, and color theory analysis.

**Step 5 — Style Verification:** A validation pass checks that each outfit meets the genre constraints, has the required item positions (top, bottom, shoes, + accessory/outerwear/bag), and doesn't repeat items across outfits.

The agent records every step — input, output, duration — so the full reasoning trace is available for debugging and evaluation.

### RAG Semantic Search

The catalog search uses Gemini's text-embedding-004 model to generate 768-dimensional vectors for every product description. At query time:

1. The search query is embedded using the same model
2. Cosine similarity is computed against all catalog embeddings in SQLite
3. Results are filtered by genre tags, price range, and category constraints
4. Top-k items are returned as candidates for the outfit generation step

A cron job re-embeds new catalog items daily and updates stale embeddings. The embedding pipeline processes items in batches of 100 to stay within Gemini's rate limits.

Semantic search solves the vocabulary mismatch problem that kills keyword search in fashion: "flowy earth-tone dress" won't match a product titled "Linen Midi Dress in Terracotta" by keywords, but their embeddings are highly similar.

### Taste Graph Engine

The taste graph is the system's long-term memory of user preferences. It operates on three style dimensions:

| Dimension | Low (0.0) | High (1.0) |
|-----------|-----------|------------|
| **Formality** | Streetwear, casual | Old Money, classic |
| **Boldness** | Minimalist, subtle | Y2K, loud |
| **Trend** | Timeless, classic | Trendy, seasonal |

Every user interaction updates the taste vector:

- **Explicit ratings** — Love (+1.0), like (+0.5), skip (-0.3), hate (-1.0). These produce large, immediate shifts.
- **Implicit signals** — Views (0.05), clicks (0.15), saves (0.3), time-on-item (scaled by duration). These are individually weak but accumulate — 20 clicks on navy items is a strong signal for formality.

Each genre maps to a position in the 3D taste space. When a user loves an Old Money outfit, the system shifts their taste vector toward high formality and low trend. After enough interactions, the taste vector accurately predicts which genres and specific items the user will prefer.

The taste graph is the competitive moat: a competitor can replicate every feature, but not the 3 months of preference data that makes recommendations feel personal.

### Genre Ruleset System

The 12 genres are database-driven: each genre is a row in `genre_rulesets` with JSON columns for rules. This means adding a new genre requires zero code changes — just an insert:

Each ruleset contains:
- **Color palette** — Allowed and forbidden colors
- **Fit rules** — Slim, relaxed, oversized, tailored per item category
- **Must-have items** — Required elements (e.g., Old Money requires a "structured piece")
- **Forbidden items** — Items that break the genre (e.g., Minimalist forbids logos)
- **Occasion modifiers** — How the genre adapts per occasion (casual, formal, date, workout)

The AI prompt builder injects the active genre's complete ruleset, so the AI generates outfits within strict stylistic constraints rather than generic fashion advice.

### Body-Aware Styling

The body rules engine maps body types to silhouette recommendations:

For each body type (hourglass, pear, rectangle, inverted triangle, apple, etc.), the system maintains rules for:
- **Flattering silhouettes** — Which cuts and fits work best per category
- **Proportion balancing** — Which item combinations create visual balance
- **Emphasis areas** — What to highlight vs. minimize

These rules are injected into the AI prompt when the user has completed their body profile, producing outfit recommendations that are both stylistically on-genre and physically flattering.

### Color Theory Engine

The color analysis module applies seasonal color theory to outfit generation:

- **Seasonal palette** — Classifies the user's coloring (warm/cool, light/deep) and identifies flattering colors
- **Complementary matching** — Ensures outfit items don't clash and follow color harmony rules
- **Genre intersection** — Finds colors that appear in both the user's flattering palette and the genre's allowed palette

This produces outfits where every item's color is intentional — not just "items that look good together" but items that look good together *on this specific person*.

### 3-Tier Fallback Chain

Fashion is a zero-tolerance-for-empty use case. The fallback chain ensures every request returns outfits:

| Tier | Source | Latency | Quality |
|------|--------|---------|---------|
| 1 | Gemini AI generation | 2–5s | Personalized, contextual |
| 2 | Redis cached responses | <100ms | Recent, less contextual |
| 3 | Editor's curated picks | <50ms | Generic but high-quality |

Tier 3 contains 48 hand-curated outfits (4 per genre across different occasions) with real brand names and prices. Even if Gemini is down and the cache is cold, the user sees professional outfit suggestions.

### Pinterest Vibe Match

Users can import Pinterest boards to bootstrap their style profile. The system:

1. Fetches board pins via the Pinterest API
2. Analyzes image descriptions and captions
3. Runs semantic matching against the 12 genre definitions
4. Maps the board's aesthetic to a weighted genre distribution
5. Seeds the taste graph with the inferred preferences

This solves the cold start problem for Pinterest-active users — they get personalized recommendations from their first session.

### AI Evaluation Suite

The `evals/` directory contains automated tests that validate AI behavior:

- **Embedding logic** — Verifies that semantically similar items produce similar embeddings
- **Prompt guardrails** — Tests input sanitization against prompt injection attempts
- **Schema validation** — Ensures AI output conforms to the expected JSON schema
- **Feature flags** — Validates that flag-gated features behave correctly in both states

These evals run in CI and catch regressions in AI behavior that unit tests can't detect.

## Results

### System Specifications

| Metric | Value |
|--------|-------|
| Total codebase | 25,000+ lines of TypeScript |
| Source files | 186 modules |
| API routes | 50 endpoints |
| Pages | 26 (24 app + 2 auth) |
| React components | 19 |
| Database tables | 27 |
| AI modules | 10 (agent, embeddings, taste, prompts, chat, + 5 more) |
| Fashion genres | 12 |
| Embedding dimensions | 768 (Gemini text-embedding-004) |
| Curated fallback outfits | 48 (4 per genre) |
| Eval test files | 4 |

### Architecture Highlights

- **Agentic reasoning** — 5-step tool chain produces contextually aware outfits, not random item matches
- **Implicit learning** — Taste graph builds accurate preference models from passive behavior
- **Zero-downtime AI** — 3-tier fallback guarantees outfit delivery regardless of API status
- **DB-driven genres** — New aesthetics added without code changes
- **Body + color aware** — Recommendations account for physical attributes, not just aesthetic preferences

## Conclusions

The key insight is that fashion recommendation requires compositional reasoning — not item ranking. A great top paired with a great bottom doesn't make a great outfit unless the items work together within a coherent aesthetic, fit the user's body, complement their coloring, suit the occasion, and match the weather. The agentic pipeline addresses this by chaining specialized tools that each handle one dimension of the problem.

The taste graph demonstrates that implicit behavioral signals, when properly weighted and accumulated, produce more accurate preference models than explicit questionnaires. Users who rate 10 outfits generate a less accurate taste profile than users who passively browse for 20 minutes — because browsing reveals genuine reactions while ratings are performative.

The genre system provides the structural foundation that makes AI-generated outfits coherent. Without explicit rules, AI fashion advice tends toward generic "safe" combinations. With genre constraints, the AI operates within a creative space that's narrow enough to be stylistically consistent but wide enough to produce varied outfits.

## Future Work

- **Virtual try-on** — AR overlay to preview outfits on the user's body photo
- **Social feed** — Community outfit sharing with genre-based discovery
- **Marketplace integration** — Direct checkout through affiliate partnerships
- **Trend forecasting** — Use social media signals to predict emerging micro-trends within each genre
