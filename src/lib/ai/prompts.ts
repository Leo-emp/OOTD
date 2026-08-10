import type { GenreRuleset } from "@/types/genre";
import type { CandidateItem, UserPreferences, QuizAnswer } from "./provider";

// Outfit composition prompt — tells Gemini exactly what to return
export function buildOutfitPrompt(
  genre: GenreRuleset,
  candidates: CandidateItem[],
  occasion: string,
  weather?: string,
  prefs?: UserPreferences
): string {
  return `You are a professional fashion stylist specializing in the "${genre.name}" aesthetic.

GENRE RULES (follow these exactly):
- Color palette: ${JSON.stringify(genre.colorRules)}
- Fit rules: ${JSON.stringify(genre.fitRules)}
- Must include: ${JSON.stringify(genre.mustHave)}
- Never include: ${JSON.stringify(genre.forbidden)}
- Occasion (${occasion}): ${genre.occasionModifiers[occasion] || "use your judgment"}

CONTEXT:
- Weather: ${weather || "moderate"}
- Budget preference: ${prefs?.priceSweetSpot ? `around $${prefs.priceSweetSpot}` : "any"}
${prefs?.preferredColors?.length ? `- Preferred colors: ${prefs.preferredColors.join(", ")}` : ""}
${prefs?.preferredBrands?.length ? `- Preferred brands: ${prefs.preferredBrands.join(", ")}` : ""}

AVAILABLE ITEMS (pick from these only — use exact IDs):
${candidates.map((item) => `- ID: ${item.id} | ${item.name} | ${item.brand} | $${item.price} | ${item.category} | ${item.color} | genres: ${item.genreTags.join(",")}`).join("\n")}

Create 3-5 complete outfits. Each outfit must have 4-6 items covering: top, bottom, shoes, and at least one of (accessory, outerwear, bag).

Return JSON matching this schema:
{
  "outfits": [
    {
      "items": [
        { "catalogItemId": "item_id_here", "position": "top|bottom|shoes|accessory|outerwear|bag" }
      ],
      "styleExplanation": "Brief explanation of why this outfit works for ${genre.name} ${occasion}"
    }
  ]
}`;
}

// Clothing analysis prompt — determines what the uploaded item is
export function buildClothingAnalysisPrompt(): string {
  return `Analyze this image. Determine:
1. Is this a clothing item or fashion accessory? (isClothing: true/false)
2. If yes: category (top, bottom, shoes, accessory, outerwear, bag), primary color, pattern (solid, striped, plaid, floral, graphic, etc.), best season, and which fashion genres it fits (from: old-money, y2k, streetwear, minimalist, cottagecore, dark-academia, coastal-grandma, grunge, coquette, gorpcore, clean-girl, indie-boho).
3. If no: provide rejectionReason.

Return JSON:
{
  "isClothing": boolean,
  "category": "top" | "bottom" | "shoes" | "accessory" | "outerwear" | "bag",
  "color": "primary color name",
  "pattern": "pattern type",
  "season": "spring" | "summer" | "fall" | "winter" | "all",
  "genreCompatibility": ["genre-slug", ...],
  "rejectionReason": "only if isClothing is false"
}`;
}

// Rating prompt — scores a user's outfit photo against a genre
export function buildRatingPrompt(genre: GenreRuleset): string {
  return `You are a fashion critic specializing in the "${genre.name}" aesthetic.

Rate this outfit photo on a scale of 1-10 for how well it matches the ${genre.name} genre.

Genre rules to judge against:
- Color palette: ${genre.colorRules.palette.join(", ")}
- Silhouette: ${genre.fitRules.silhouette}
- Must-haves: ${genre.mustHave.join(", ")}
- Forbidden: ${genre.forbidden.join(", ")}

Return JSON:
{
  "score": 1-10,
  "feedback": "Overall assessment in 1-2 sentences",
  "improvements": ["specific actionable improvement 1", "improvement 2", "improvement 3"],
  "genreAlignment": 0-100 (percentage match to genre rules)
}`;
}

// Quiz analysis prompt — determines genre breakdown from answers
export function buildQuizPrompt(answers: QuizAnswer[]): string {
  return `Analyze these style quiz answers and determine the user's fashion genre breakdown.

Available genres: Old Money, Y2K, Streetwear, Minimalist, Cottagecore, Dark Academia, Coastal Grandma, Grunge, Coquette, Gorpcore, Clean Girl, Indie/Boho.

User's answers:
${answers.map((a) => `Q${a.questionId}: chose "${a.selectedOption}"${a.imageChosen ? ` (image: ${a.imageChosen})` : ""}`).join("\n")}

Return JSON with three genres that add up to 100%:
{
  "primaryGenre": "genre-slug",
  "primaryPercentage": number,
  "secondaryGenre": "genre-slug",
  "secondaryPercentage": number,
  "accentGenre": "genre-slug",
  "accentPercentage": number,
  "summary": "2-3 sentence personality-driven style summary, friendly and fun tone"
}`;
}

// Stylist chat system prompt — shifts personality per genre
export function buildStylistSystemPrompt(
  genre: GenreRuleset,
  profileSummary?: string,
  recentOutfits?: string
): string {
  return `You are OOTD AI, a fun and knowledgeable personal fashion stylist. Your personality is warm, encouraging, and trendy — like a stylish best friend.

CURRENT GENRE: ${genre.name}
${genre.description}

GENRE RULES YOU MUST FOLLOW:
- Only recommend items matching these colors: ${genre.colorRules.palette.join(", ")}
- Silhouette: ${genre.fitRules.silhouette}
- Always include: ${genre.mustHave.join(" or ")}
- Never suggest: ${genre.forbidden.join(", ")}
- Reference brands: ${genre.referenceBrands.join(", ")}

${profileSummary ? `USER PROFILE:\n${profileSummary}` : ""}
${recentOutfits ? `RECENT OUTFITS THEY RATED:\n${recentOutfits}` : ""}

RULES:
1. Only answer fashion-related questions. If asked about anything else, redirect playfully to fashion.
2. When suggesting outfits, always stay within the genre rules above.
3. If the user uploads a photo, rate it 1-10 and give specific improvement tips.
4. Be concise — 2-3 sentences per response unless they ask for detail.
5. Use a fun, Gen-Z-friendly tone but not cringey. No excessive emojis.
6. When suggesting items to buy, mention the type and brand range but don't make up specific product names or URLs.`;
}
