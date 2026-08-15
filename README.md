# OOTD AI

A premium AI fashion platform that recommends outfits based on your personal style genome, wardrobe inventory, body type, and color profile. The system learns from every interaction — builds a taste graph from swipes, views, and saves — so recommendations get sharper over time. Supports 12 fashion genres from Old Money to Streetwear, with weather-aware suggestions and shoppable affiliate links.

Built as a production-grade Next.js application: **25,000+ lines of TypeScript**, 50 API routes, 27 database tables, agentic AI pipeline, RAG semantic search, and a 3-tier AI fallback chain.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    USER DASHBOARD                             │
│  Style quiz · Wardrobe · Outfits · Feed · Discover · Shop   │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     50 API ROUTES                             │
│  /outfits · /wardrobe · /chat · /quiz · /genres · /shop     │
│  /weather · /feed · /streaks · /pinterest · /taste           │
└────────────────────────────┬─────────────────────────────────┘
                             │
    ┌────────────────────────┼──────────────────────────┐
    │                        │                          │
    ▼                        ▼                          ▼
┌──────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  AGENTIC AI      │  │  TASTE       │  │  WARDROBE           │
│                  │  │  ENGINE      │  │                     │
│ Wardrobe analyze │  │              │  │ Photo upload        │
│ Gap detection    │  │ Taste graph  │  │ Color extraction    │
│ Semantic search  │  │ Engagement   │  │ Category tagging    │
│ Outfit generate  │  │ Preference   │  │ Brand detection     │
│ Style verify     │  │ learning     │  │ Owned-first logic   │
└──────────────────┘  └──────────────┘  └─────────────────────┘
        │                    │                      │
        ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   STYLING ENGINE                              │
│  12 genre rulesets · Body type rules · Color theory           │
│  Weather adaptation · Occasion modifiers · Budget filters     │
└─────────────────────────────────────────────────────────────┘
        │
    ┌───┴────────────────────────────────────────────┐
    ▼                                                ▼
┌──────────────────┐                      ┌──────────────────┐
│  CATALOG         │                      │  ENGAGEMENT      │
│                  │                      │                  │
│ Product search   │                      │ Rate my outfit   │
│ RAG embeddings   │                      │ Style evolution  │
│ Affiliate links  │                      │ Glow-up tracker  │
│ Pinterest vibe   │                      │ Challenges       │
│ match            │                      │ Streaks + XP     │
└──────────────────┘                      └──────────────────┘
```

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
│   │   │   ├── style-evolution/      # Glow-up + progress
│   │   │   ├── seasonal-refresh/     # Seasonal wardrobe refresh
│   │   │   ├── stripe/               # Billing + webhooks
│   │   │   └── cron/                 # Catalog sync, embeddings
│   │   ├── (app)/                    # 24 authenticated pages
│   │   │   ├── dashboard/            # Home feed
│   │   │   ├── stylist/              # AI chat stylist
│   │   │   ├── wardrobe/             # Virtual closet
│   │   │   ├── discover/             # Browse genres
│   │   │   ├── genres/               # Genre detail pages
│   │   │   ├── outfit/               # Outfit detail + rating
│   │   │   ├── shop/                 # Shopping with affiliate
│   │   │   ├── profile/              # User profile + settings
│   │   │   ├── weather-outfit/       # Weather-aware outfits
│   │   │   ├── rate-my-outfit/       # Community rating
│   │   │   ├── glow-up/              # Style evolution tracker
│   │   │   ├── streaks/              # Engagement streaks
│   │   │   └── taste/                # Taste profile visualization
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
│   │       ├── schema.ts             # 27 tables
│   │       └── seed-*.ts             # Genre, catalog, feed seeds
│   └── types/                        # TypeScript type definitions
├── evals/                            # AI evaluation test suite
│   ├── embedding-logic.test.ts       # RAG accuracy tests
│   ├── prompt-guardrails.test.ts     # Injection prevention tests
│   ├── schema-validation.test.ts     # Output schema tests
│   └── feature-flags.test.ts         # Feature flag tests
└── public/                           # Static assets
```

## By the Numbers

| Metric | Value |
|--------|-------|
| Lines of code | 25,000+ TypeScript |
| Source files | 186 modules |
| API routes | 50 endpoints |
| Pages | 24 authenticated + 2 auth |
| React components | 19 |
| Custom hooks | 5 |
| Database tables | 27 |
| AI modules | 10 |
| Fashion genres | 12 |
| Curated fallback outfits | 48 (4 per genre) |
| Eval test files | 4 |

## Key Engineering Decisions

**Why an agentic pipeline instead of a single prompt?** A single "generate outfits" prompt can't reason about what the user already owns, what's missing, or which catalog items are semantically relevant. The agent chains 5 tools — wardrobe analysis, gap detection, semantic search, outfit generation, and style verification — so each step informs the next.

**Why RAG for catalog search?** Keyword search fails for fashion: "a flowy summer dress in earth tones" doesn't match any product title. Semantic embeddings let the system find items that match the vibe, not just the words.

**Why 12 genres as the core model?** Genre-based styling replaces the impossible task of understanding arbitrary free-text preferences. Each genre has explicit rules (color palette, fit rules, forbidden items, occasion modifiers) stored in the database — adding a new genre is an insert, not a code change.

**Why a taste graph?** After 3 months of use, the taste graph knows the user's formality/boldness/trend preferences better than they could articulate. This is the competitive moat — a new app can replicate features but not 3 months of learned preferences.

**Why 3-tier fallback?** Fashion is the use case where "no results" is unacceptable. The fallback chain (Gemini → cached results → editor's curated picks) ensures every user always sees outfits, even during API outages.

## Setup

```bash
git clone https://github.com/Leo-emp/OOTD.git
cd OOTD

npm install

# Configure environment
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
