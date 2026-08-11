// Vibe Match — analyzes Pinterest board aesthetic and maps to OOTD AI genres
// Uses Gemini vision to understand the visual language of a user's board

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PinterestPin } from "./client";
import { requireEnv } from "@/lib/env";
import { GEMINI_MODEL } from "@/lib/constants";

// Lazy-init Gemini for vision analysis
let _genai: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!_genai) _genai = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
  return _genai;
}

// Result of analyzing a board/pin for genre mapping
export interface VibeMatchResult {
  // Top 3 genre matches with percentages (adds to 100)
  genres: { slug: string; name: string; percentage: number }[];
  // Color palette extracted from the pins
  palette: string[];
  // Overall aesthetic description
  aesthetic: string;
  // Specific style notes the AI picked up
  styleNotes: string[];
  // Mood keywords
  mood: string[];
}

// Analyze a set of pins from a board — batch vision analysis
export async function analyzeBoard(pins: PinterestPin[]): Promise<VibeMatchResult> {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  // Build a text description of the pins for analysis
  // Using descriptions + titles + colors (more token-efficient than sending images)
  const pinDescriptions = pins.slice(0, 30).map((p, i) =>
    `Pin ${i + 1}: "${p.title}" - ${p.description || "no description"}${p.dominantColor ? ` (dominant color: ${p.dominantColor})` : ""}`
  ).join("\n");

  const prompt = `You are a fashion AI that maps visual aesthetics to specific style genres.

Analyze this Pinterest board and determine which fashion genres it aligns with.

Available genres (use these exact slugs):
- old-money: Classic luxury, quiet wealth, Ralph Lauren, cashmere, neutrals
- y2k: 2000s revival, low-rise, butterfly clips, baby tees, metallics
- streetwear: Urban culture, sneakers, hoodies, bold logos, graphic tees
- minimalist: Clean lines, neutral palette, quality basics, Scandinavian
- cottagecore: Rural romantic, florals, linen, prairie dresses, earthy
- dark-academia: Scholarly, tweed, brown palette, Oxford aesthetic
- coastal-grandma: Coastal living, linen, Diane Keaton, soft blues/whites
- grunge: 90s rock, distressed denim, plaid flannel, combat boots
- coquette: Feminine, bows, pink, lace, soft romantic
- gorpcore: Outdoor technical, hiking boots, fleece, functional fashion
- clean-girl: Effortless beauty, slicked hair, gold hoops, glossy skin
- indie-boho: Free-spirited, vintage, layered jewelry, earth tones

Board pins:
${pinDescriptions}

Return JSON only:
{
  "genres": [
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 45 },
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 35 },
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 20 }
  ],
  "palette": ["color1", "color2", "color3", "color4", "color5"],
  "aesthetic": "2-3 sentence description of the board's overall aesthetic",
  "styleNotes": ["specific style observation 1", "observation 2", "observation 3"],
  "mood": ["keyword1", "keyword2", "keyword3", "keyword4"]
}

Percentages must add to 100. Be specific in style notes — mention actual garments, fabrics, colors seen.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse vibe match response");

  return safeParseVibeMatch(jsonMatch[0]);
}

// Safe JSON parse for vibe match responses
function safeParseVibeMatch(text: string): VibeMatchResult {
  try {
    return JSON.parse(text) as VibeMatchResult;
  } catch {
    console.error("[VibeMatch] Invalid JSON:", text.slice(0, 200));
    throw new Error("AI returned invalid JSON for vibe match. Please try again.");
  }
}

// Analyze a single pin image — uses vision model for direct image analysis
export async function analyzePinImage(imageUrl: string): Promise<VibeMatchResult> {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  // Fetch the image and convert to base64
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to fetch pin image");
  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const prompt = `You are a fashion AI that maps visual aesthetics to specific style genres.

Analyze this fashion/outfit image and determine which style genres it represents.

Available genres (use these exact slugs):
old-money, y2k, streetwear, minimalist, cottagecore, dark-academia, coastal-grandma, grunge, coquette, gorpcore, clean-girl, indie-boho

Return JSON only:
{
  "genres": [
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 50 },
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 30 },
    { "slug": "genre-slug", "name": "Genre Name", "percentage": 20 }
  ],
  "palette": ["color1", "color2", "color3", "color4", "color5"],
  "aesthetic": "2-3 sentence description of this outfit's aesthetic",
  "styleNotes": ["observation 1", "observation 2", "observation 3"],
  "mood": ["keyword1", "keyword2", "keyword3"]
}

Percentages must add to 100.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: "image/jpeg", data: base64 } },
  ]);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse vibe match response");

  return safeParseVibeMatch(jsonMatch[0]);
}

// Find catalog items similar to a Pinterest pin's aesthetic
export interface ShopPinResult {
  matchedGenre: string;
  similarItems: { id: string; name: string; brand: string; price: number; imageUrl: string; affiliateUrl: string }[];
}
