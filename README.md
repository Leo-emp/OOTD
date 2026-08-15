# OOTD AI

A premium AI fashion platform that recommends outfits based on your personal style genome, wardrobe inventory, body type, and color profile. The system learns from every interaction — builds a taste graph from swipes, views, and saves — so recommendations get sharper over time. Supports 12 fashion genres from Old Money to Streetwear, with weather-aware suggestions and shoppable affiliate links.

Built as a production-grade Next.js application: **25,000+ lines of TypeScript**, 50 API routes, 27 database tables, agentic AI pipeline, RAG semantic search, and a 3-tier AI fallback chain.

---

## Architecture

```mermaid
graph TB
    subgraph UI["USER DASHBOARD"]
        UD[Style quiz · Wardrobe · Outfits<br/>Feed · Discover · Shop · Chat]
    end

    subgraph API["50 API ROUTES"]
        OF[/outfits · /wardrobe · /chat]
        QZ[/quiz · /genres · /taste]
        SH[/shop · /weather · /feed]
        EN[/engagement · /streaks<br/>/pinterest · /challenges]
    end

    subgraph Agent["AGENTIC AI PIPELINE"]
        S1["Step 1: Analyze Wardrobe<br/>Categorize + identify gaps"]
        S2["Step 2: Gap Detection<br/>Genre requirements vs owned"]
        S3["Step 3: Semantic Search<br/>RAG 768-dim embeddings"]
        S4["Step 4: Outfit Generation<br/>Genre rules + body + color"]
        S5["Step 5: Style Verification<br/>Constraint check + dedup"]
    end

    subgraph Taste["TASTE ENGINE"]
        TG[Taste Graph<br/>3-axis: formality<br/>boldness · trend]
        IM[Implicit Signals<br/>Views 0.05 · Clicks 0.15<br/>Saves 0.3 · Time-on-item]
        PN[Pinterest Vibe Match<br/>Board → genre mapping]
    end

    subgraph Styling["STYLING ENGINE"]
        GR[12 Genre Rulesets<br/>Color · fit · must-have<br/>· forbidden · occasion]
        BR[Body Rules<br/>Silhouette matching<br/>proportion balancing]
        CT[Color Theory<br/>Seasonal analysis<br/>complementary palettes]
    end

    subgraph Fallback["3-TIER FALLBACK"]
        T1[Tier 1: Gemini AI<br/>2-5s · personalized]
        T2[Tier 2: Redis Cache<br/>100ms · recent results]
        T3[Tier 3: Editor's Picks<br/>50ms · 48 curated outfits]
    end

    subgraph Data["DATA LAYER"]
        DB[(Drizzle ORM<br/>SQLite / Turso<br/>27 tables)]
        AU[Better Auth]
        SP[Stripe · PostHog]
    end

    UI --> API
    API --> Agent
    S1 --> S2 --> S3 --> S4 --> S5
    Agent --> Taste & Styling
    S3 --> DB
    Agent --> Fallback
    Fallback --> Data

    style Agent fill:#1a1a2e,stroke:#FB7185,color:#fff
    style Taste fill:#1a1a2e,stroke:#F59E0B,color:#fff
    style Styling fill:#1a1a2e,stroke:#A78BFA,color:#fff
    style Fallback fill:#1a1a2e,stroke:#10B981,color:#fff
```

## Problem Statement

Fashion recommendation is one of the hardest personalization problems in consumer AI. Unlike music or movies — where taste can be expressed as genre preferences — clothing exists at the intersection of aesthetics, body type, occasion, weather, budget, and cultural context. A recommendation that ignores any of these dimensions fails.

Three technical challenges make this harder than a standard recommendation engine:

1. **Multi-modal preference learning** — Users can't articulate their style in words. "I like minimalist but sometimes edgy" is meaningless to a system. Preferences must be learned implicitly from behavior: what they save, how long they look, what they skip.
2. **Combinatorial explosion** — An outfit is 4–6 items that must work together. With a catalog of 500+ items across 12 genres, the number of valid combinations exceeds what any ranking model can score exhaustively. The system needs compositional reasoning, not item-by-item ranking.
3. **Cold start** — A new user has no history. The system must produce good recommendations from the first interaction, then improve rapidly as data accumulates.

---

## Technical Deep Dive

### Agentic Outfit Pipeline

The core outfit generation uses a multi-step AI agent rather than a single prompt. Each step is a distinct tool that the agent calls in sequence:

**Step 1 — Analyze Wardrobe:** Fetch the user's wardrobe items from the database, categorize by type (tops, bottoms, shoes, accessories), and identify gaps (no formal shoes, no outerwear, etc.).

**Step 2 — Gap Detection:** Compare the wardrobe against the genre's requirements. If the user wants an Old Money outfit but owns no tailored trousers, the agent flags this and prioritizes catalog items that fill the gap.

**Step 3 — Semantic Search:** Use RAG embeddings to find catalog items that match the styling context. The query combines genre aesthetic, occasion, weather, and body type into a natural language search — "structured linen blazer in neutral tones for warm weather formal" — and retrieves the top-k semantically similar items.

**Step 4 — Outfit Generation:** With wardrobe items + relevant catalog items as the candidate pool, the AI generates 3–5 complete outfits. The prompt includes the genre's explicit rules (color palette, fit rules, forbidden items), body-type-specific silhouette recommendations, and color theory analysis.

**Step 5 — Style Verification:** A validation pass checks that each outfit meets the genre constraints, has the required item positions (top, bottom, shoes, + accessory/outerwear/bag), and doesn't repeat items across outfits.

### RAG Semantic Search

The catalog search uses Gemini's text-embedding-004 model to generate 768-dimensional vectors for every product description. At query time:

1. The search query is embedded using the same model
2. Cosine similarity is computed against all catalog embeddings in SQLite
3. Results are filtered by genre tags, price range, and category constraints
4. Top-k items are returned as candidates for the outfit generation step

Semantic search solves the vocabulary mismatch problem that kills keyword search in fashion: "flowy earth-tone dress" won't match a product titled "Linen Midi Dress in Terracotta" by keywords, but their embeddings are highly similar.

### Taste Graph Engine

The taste graph is the system's long-term memory of user preferences. It operates on three style dimensions:

| Dimension | Low (0.0) | High (1.0) |
|-----------|-----------|------------|
| **Formality** | Streetwear, casual | Old Money, classic |
| **Boldness** | Minimalist, subtle | Y2K, loud |
| **Trend** | Timeless, classic | Trendy, seasonal |

Every user interaction updates the taste vector:

- **Explicit ratings** — Love (+1.0), like (+0.5), skip (-0.3), hate (-1.0). Large, immediate shifts.
- **Implicit signals** — Views (0.05), clicks (0.15), saves (0.3), time-on-item (scaled by duration). Individually weak but accumulate — 20 clicks on navy items is a strong signal for formality.

Each genre maps to a position in the 3D taste space. After enough interactions, the taste vector accurately predicts which genres and specific items the user will prefer. This is the competitive moat — a new app can replicate features but not 3 months of learned preferences.

### Genre Ruleset System

The 12 genres are database-driven — each genre is a row in `genre_rulesets` with JSON columns for rules. Adding a new genre requires zero code changes — just an insert. Each ruleset contains:

- **Color palette** — Allowed and forbidden colors
- **Fit rules** — Slim, relaxed, oversized, tailored per item category
- **Must-have items** — Required elements (e.g., Old Money requires a "structured piece")
- **Forbidden items** — Items that break the genre (e.g., Minimalist forbids logos)
- **Occasion modifiers** — How the genre adapts per occasion (casual, formal, date, workout)

### Body-Aware Styling

The body rules engine maps body types to silhouette recommendations. For each body type (hourglass, pear, rectangle, inverted triangle, apple, etc.), the system maintains rules for flattering silhouettes, proportion balancing, and emphasis areas. These rules are injected into the AI prompt when the user has completed their body profile, producing recommendations that are both stylistically on-genre and physically flattering.

### Color Theory Engine

The color analysis module applies seasonal color theory:

- **Seasonal palette** — Classifies the user's coloring (warm/cool, light/deep) and identifies flattering colors
- **Complementary matching** — Ensures outfit items follow color harmony rules
- **Genre intersection** — Finds colors that appear in both the user's flattering palette and the genre's allowed palette

This produces outfits where every item's color is intentional — items that look good together *on this specific person*.

### 3-Tier Fallback Chain

Fashion is a zero-tolerance-for-empty use case. The fallback chain ensures every request returns outfits:

| Tier | Source | Latency | Quality |
|------|--------|---------|---------|
| 1 | Gemini AI generation | 2–5s | Personalized, contextual |
| 2 | Redis cached responses | <100ms | Recent, less contextual |
| 3 | Editor's curated picks | <50ms | Generic but high-quality |

Tier 3 contains 48 hand-curated outfits (4 per genre across different occasions) with real brand names and prices.

### Pinterest Vibe Match

Users can import Pinterest boards to bootstrap their style profile. The system fetches board pins, analyzes image descriptions, runs semantic matching against the 12 genre definitions, maps the board's aesthetic to a weighted genre distribution, and seeds the taste graph with the inferred preferences. This solves the cold start problem for Pinterest-active users.

### AI Evaluation Suite

The `evals/` directory contains automated tests that validate AI behavior:

- **Embedding logic** — Verifies semantically similar items produce similar embeddings
- **Prompt guardrails** — Tests input sanitization against prompt injection attempts
- **Schema validation** — Ensures AI output conforms to expected JSON schema
- **Feature flags** — Validates flag-gated features behave correctly in both states

---

## AI/ML Techniques

| # | Technique | Implementation | Purpose |
|---|-----------|---------------|---------|
| 1 | **Agentic Pipeline** | Multi-step agent: analyze → gaps → search → generate → verify | Chain-of-thought outfit generation with tool use |
| 2 | **RAG Semantic Search** | Gemini text-embedding-004, 768-dim vectors, cosine similarity | Find visually/stylistically similar items in catalog |
| 3 | **Taste Graph** | 3-axis profiling (formality, boldness, trend) from all interactions | Learn personal style preferences implicitly over time |
| 4 | **Body-Aware Styling** | Rule engine for body types, silhouette matching, fit selection | Recommend flattering cuts per body shape |
| 5 | **Color Theory Engine** | Seasonal color analysis, complementary palettes, contrast rules | Match clothing colors to skin tone and undertone |
| 6 | **3-Tier AI Fallback** | Gemini → Redis cache → Editor's picks (48 curated outfits) | Near-100% availability even during API outages |
| 7 | **Implicit Engagement** | Weighted signals: views (0.05), clicks (0.15), saves (0.3), time | Learn preferences without requiring explicit ratings |
| 8 | **Pinterest Vibe Match** | Board analysis + semantic mapping to genre system | Import style inspiration and map to outfit generation |
| 9 | **AI Style Chat** | Conversational stylist with wardrobe + preference context | Natural language outfit requests and style advice |
| 10 | **Prompt Guardrails** | Input sanitization + output validation + eval test suite | Prevent prompt injection and ensure safe AI responses |

## The 12 Genres

| Genre | Formality | Boldness | Example Brands |
|-------|-----------|----------|---------------|
| Old Money | Classic | Subtle | Ralph Lauren, Brooks Brothers |
| Minimalist | Neutral | Restrained | COS, Everlane, Uniqlo |
| Streetwear | Casual | Bold | Nike, Stüssy, Supreme |
| Cottagecore | Relaxed | Soft | Free People, Dôen |
| Dark Academia | Scholarly | Moody | Barbour, Doc Martens |
| Y2K | Playful | Loud | Juicy Couture, Ed Hardy |
| Coastal Grandma | Relaxed | Classic | L.L.Bean, Eileen Fisher |
| Grunge | Rebellious | Raw | Converse, Levi's |
| Coquette | Feminine | Delicate | Reformation, Rouje |
| Gorpcore | Outdoors | Technical | Arc'teryx, Salomon |
| Clean Girl | Polished | Minimal | Aritzia, Skims |
| Indie Boho | Free-spirited | Eclectic | Anthropologie, Spell |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | SQLite via Drizzle ORM (27 tables) |
| Auth | Better Auth (email + social) |
| AI | Google Gemini (generation, embeddings, chat) |
| Billing | Stripe |
| Cache | Redis (rate limiting, AI response cache) |
| Analytics | PostHog |
| Image | Upload + processing pipeline |
| Testing | Vitest (evals: embeddings, flags, guardrails, schema) |
| Deployment | Vercel + Turso |

## Project Structure

```
ootd-ai/                             # 25,000+ lines of TypeScript
├── src/
│   ├── app/
│   │   ├── api/                      # 50 API routes
│   │   │   ├── outfits/              # Outfit generation + rating
│   │   │   ├── wardrobe/             # Wardrobe CRUD + photo upload
│   │   │   ├── chat/                 # AI stylist conversation
│   │   │   ├── quiz/                 # Style quiz + genre detection
│   │   │   ├── genres/               # Genre rulesets + switching
│   │   │   ├── catalog/              # Product search + sync
│   │   │   ├── weather/              # Weather-aware suggestions
│   │   │   ├── feed/                 # Personalized outfit feed
│   │   │   ├── shop/                 # Shoppable affiliate links
│   │   │   ├── pinterest/            # Pinterest board import
│   │   │   ├── taste/                # Taste graph queries
│   │   │   ├── streaks/              # Engagement streaks
│   │   │   ├── challenges/           # Style challenges
│   │   │   ├── engagement/           # Implicit signal tracking
│   │   │   ├── stripe/               # Billing + webhooks
│   │   │   └── cron/                 # Catalog sync, embeddings
│   │   ├── (app)/                    # 24 authenticated pages
│   │   └── (auth)/                   # Login + signup
│   ├── components/                   # 19 React components
│   ├── hooks/                        # 5 custom hooks
│   ├── lib/
│   │   ├── ai/                       # 10 AI modules
│   │   │   ├── agent.ts              # Agentic outfit pipeline
│   │   │   ├── embeddings.ts         # RAG semantic search
│   │   │   ├── taste.ts              # Taste graph engine
│   │   │   ├── prompts.ts            # Genre-aware prompt builder
│   │   │   ├── gemini.ts             # Gemini API client
│   │   │   ├── preferences.ts        # Learned preference system
│   │   │   ├── editors-picks.ts      # Curated fallback outfits
│   │   │   ├── fallback.ts           # 3-tier fallback chain
│   │   │   ├── sanitize.ts           # Prompt guardrails
│   │   │   └── provider.ts           # AI provider abstraction
│   │   ├── styling/                  # Styling rules engine
│   │   │   ├── body-rules.ts         # Body type → silhouette rules
│   │   │   ├── color-theory.ts       # Color analysis + palettes
│   │   │   └── engagement.ts         # Implicit signal tracking
│   │   ├── catalog/                  # Product catalog
│   │   ├── pinterest/                # Pinterest integration
│   │   ├── stripe/                   # Billing
│   │   ├── cache/                    # Redis + rate limiting
│   │   └── db/                       # Schema + seeds
│   └── types/                        # TypeScript type definitions
├── evals/                            # AI evaluation test suite
└── public/                           # Static assets
```

## By the Numbers

| Metric | Value |
|--------|-------|
| Lines of code | 25,000+ TypeScript |
| Source files | 186 modules |
| API routes | 50 endpoints |
| Pages | 26 (24 app + 2 auth) |
| Database tables | 27 |
| AI modules | 10 |
| Fashion genres | 12 |
| Embedding dimensions | 768 |
| Curated fallback outfits | 48 |
| Eval test files | 4 |

## Key Engineering Decisions

**Why an agentic pipeline instead of a single prompt?** A single "generate outfits" prompt can't reason about what the user already owns, what's missing, or which catalog items are semantically relevant. The agent chains 5 tools — wardrobe analysis, gap detection, semantic search, outfit generation, and style verification — so each step informs the next.

**Why RAG for catalog search?** Keyword search fails for fashion: "a flowy summer dress in earth tones" doesn't match any product title. Semantic embeddings let the system find items that match the vibe, not just the words.

**Why 12 genres as the core model?** Genre-based styling replaces the impossible task of understanding arbitrary free-text preferences. Each genre has explicit rules stored in the database — adding a new genre is an insert, not a code change.

**Why a taste graph?** After 3 months of use, the taste graph knows the user's formality/boldness/trend preferences better than they could articulate. This is the competitive moat — a new app can replicate features but not 3 months of learned preferences.

**Why 3-tier fallback?** Fashion is the use case where "no results" is unacceptable. The fallback chain (Gemini → cached results → editor's curated picks) ensures every user always sees outfits, even during API outages.

## Future Work

- **Virtual try-on** — AR overlay to preview outfits on the user's body photo
- **Social feed** — Community outfit sharing with genre-based discovery
- **Marketplace integration** — Direct checkout through affiliate partnerships
- **Trend forecasting** — Use social media signals to predict emerging micro-trends within each genre

## Setup

```bash
git clone https://github.com/Leo-emp/OOTD.git
cd OOTD

npm install

cp .env.example .env
# Add: GEMINI_API_KEY, BETTER_AUTH_SECRET, DATABASE_URL
# Add: STRIPE_SECRET_KEY, REDIS_URL, POSTHOG_KEY

npx drizzle-kit migrate
npm run seed
npm run dev
```

## Live

- **Repository:** [github.com/Leo-emp/OOTD](https://github.com/Leo-emp/OOTD)

## License

MIT
