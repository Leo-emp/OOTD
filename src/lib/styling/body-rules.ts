// Professional body shape styling rules
// Based on the same frameworks used by Stitch Fix, Nordstrom stylists, and WGSN
// Maps body shape + height + proportions → specific fit/silhouette recommendations
// These rules override or supplement the genre's default fit rules

// ─── Body shape classification ──────────────────────
// 6 primary shapes based on shoulder-to-hip ratio and waist definition
export type BodyShape =
  | "hourglass"       // balanced shoulders/hips, defined waist
  | "pear"            // narrower shoulders, wider hips
  | "apple"           // wider midsection, narrower hips
  | "rectangle"       // balanced, minimal waist definition
  | "inverted_triangle" // broader shoulders, narrower hips
  | "athletic";       // muscular build, minimal curves

export type HeightRange = "petite" | "average" | "tall";
export type FitPreference = "fitted" | "relaxed" | "oversized";

export interface BodyProfile {
  shape: BodyShape;
  height: HeightRange;
  fitPreference: FitPreference;
  // Areas the user wants to draw attention to or minimize
  highlight: string[];  // e.g. ["waist", "legs", "shoulders"]
  minimize: string[];   // e.g. ["midsection", "hips", "arms"]
}

// ─── Fit rules per body shape ───────────────────────
// What silhouettes and cuts flatter each shape
interface ShapeRules {
  bestSilhouettes: string[];
  avoidSilhouettes: string[];
  topRules: string;
  bottomRules: string;
  outerwearRules: string;
  dressRules: string;
  proportionTip: string;
}

const SHAPE_RULES: Record<BodyShape, ShapeRules> = {
  hourglass: {
    bestSilhouettes: ["fitted", "wrap", "belted", "A-line"],
    avoidSilhouettes: ["boxy", "shapeless", "overly baggy"],
    topRules: "Fitted or wrap tops that follow the natural waist. V-necks and scoop necks work well. Avoid boxy cuts that hide the waist.",
    bottomRules: "High-waisted or mid-rise that sits at the natural waist. Straight-leg, bootcut, or wide-leg all work. Avoid low-rise that cuts at the widest point.",
    outerwearRules: "Belted coats and jackets that define the waist. Structured blazers. Avoid oversized boxy coats unless belted.",
    dressRules: "Wrap dresses, fit-and-flare, bodycon. Anything that follows the waist. Avoid shift dresses that hang straight.",
    proportionTip: "Your shoulders and hips are balanced — emphasize the waist to play up your natural proportions.",
  },
  pear: {
    bestSilhouettes: ["A-line", "structured shoulders", "boot-cut", "flared"],
    avoidSilhouettes: ["skinny bottom + loose top", "hip-hugging"],
    topRules: "Structured shoulders, boat necks, off-shoulder, statement sleeves to balance the silhouette. Bright colors and patterns on top draw the eye upward.",
    bottomRules: "Dark-colored bottoms. A-line skirts, wide-leg trousers, bootcut jeans. Avoid skinny jeans that emphasize the hip-thigh contrast. High-waisted to elongate legs.",
    outerwearRules: "Cropped jackets that end above the hip. Structured shoulders. Avoid long coats that add bulk to the hip area.",
    dressRules: "A-line, fit-and-flare, empire waist. Darker colors on the bottom half. Avoid bodycon that clings to hips.",
    proportionTip: "Balance narrower shoulders with wider hips — draw attention upward with neckline details, shoulder structure, and lighter/brighter tops.",
  },
  apple: {
    bestSilhouettes: ["empire waist", "straight", "elongating", "V-neck"],
    avoidSilhouettes: ["cinched waist", "crop top", "tucked in"],
    topRules: "V-necks and open necklines to elongate the torso. Tops that skim (not cling to) the midsection. Empire waist or peplum. Avoid tight waistbands and clingy fabrics around the middle.",
    bottomRules: "Straight-leg or bootcut with a mid-rise. Dark colors create a continuous line. Avoid pleated fronts or gathered waists that add volume to the midsection.",
    outerwearRules: "Open-front blazers and cardigans that create a vertical line. Longline coats. Avoid double-breasted or boxy jackets.",
    dressRules: "Empire waist, wrap dresses, A-line with defined bust and flowing skirt. Avoid clingy bodycon or belted styles.",
    proportionTip: "Elongate the torso with vertical lines, open necklines, and monochrome outfits. Your legs are your best asset — show them off.",
  },
  rectangle: {
    bestSilhouettes: ["layered", "belted", "peplum", "textured"],
    avoidSilhouettes: ["overly boxy", "column dress"],
    topRules: "Create curves with peplum tops, ruffles, wrap styles, and structured pieces. Layer to add dimension. Crop tops work great with high-waisted bottoms.",
    bottomRules: "Anything goes — experiment with pleats, wide-leg, cargo, and textured fabrics to add shape. Paper-bag waist and belted styles create waist definition.",
    outerwearRules: "Belted trench coats and wrap coats. Double-breasted blazers. Anything that creates a waist. Avoid straight-cut coats.",
    dressRules: "Belted shirt dresses, wrap dresses, ruched sides. Add a belt to shift dresses. Peplum details create waist illusion.",
    proportionTip: "Your proportions are balanced — add shape through strategic layering, belts, and textured fabrics to create visual curves.",
  },
  inverted_triangle: {
    bestSilhouettes: ["V-neck", "straight-leg", "wide-leg", "A-line"],
    avoidSilhouettes: ["shoulder pads", "puffy sleeves", "halter neck"],
    topRules: "V-necks, scoop necks, and raglan sleeves to soften broad shoulders. Avoid halter necks, boat necks, and puffy sleeves that widen shoulders further.",
    bottomRules: "Wide-leg trousers, flared jeans, A-line skirts — anything that adds volume below to balance broader shoulders. Light colors and patterns on bottoms.",
    outerwearRules: "Single-breasted blazers with narrow lapels. Avoid double-breasted or padded-shoulder styles. Raglan-sleeve coats work well.",
    dressRules: "A-line, fit-and-flare from the waist down. Avoid strapless or halter that emphasize shoulder width. Wrap dresses with soft shoulders.",
    proportionTip: "Balance broader shoulders with volume on the bottom half. Draw the eye downward with lighter/brighter bottoms and darker, simpler tops.",
  },
  athletic: {
    bestSilhouettes: ["feminine details", "wrap", "layered", "textured"],
    avoidSilhouettes: ["skin-tight", "compression-style"],
    topRules: "Soft fabrics (silk, chiffon, cashmere) over athletic-looking synthetics. Wrap and draped styles add softness. Avoid sports-adjacent fabrics unless intentionally gorpcore.",
    bottomRules: "Wide-leg and flared create contrast with a toned physique. High-waisted everything. Pleats and flowing fabrics add movement. Avoid overly athletic silhouettes for non-sporty occasions.",
    outerwearRules: "Feminine cuts — belted coats, leather jackets, draped cardigans. Contrast structured outerwear with soft inner layers.",
    dressRules: "Wrap dresses, midi with movement, anything with draping or ruching. The goal is softness to contrast an athletic frame.",
    proportionTip: "Your build is naturally strong — for fashion contexts, contrast that with soft fabrics, flowing silhouettes, and feminine details (unless going for gorpcore/streetwear where lean into it).",
  },
};

// ─── Height-specific adjustments ────────────────────
const HEIGHT_RULES: Record<HeightRange, string> = {
  petite: "Prioritize high-waisted bottoms to elongate legs. Avoid oversized pieces that overwhelm the frame. Cropped jackets and ankle-length pants create length. Monochrome outfits and vertical stripes elongate. Avoid horizontal breaks (contrasting belt, cuffed pants) that visually shorten.",
  average: "Most standard sizing and proportions work well. Free to experiment with any silhouette. Both cropped and full-length pieces work. Heels are optional, not corrective.",
  tall: "Can pull off oversized, maxi lengths, and wide-leg trousers that might overwhelm shorter frames. Mid-rise works as well as high-rise. Color blocking and horizontal stripes are flattering. Long coats and floor-length dresses look editorial.",
};

// ─── Build the body-aware prompt section ────────────
// Returns a block of text to inject into the AI outfit prompt
export function buildBodyPromptSection(profile: BodyProfile): string {
  const rules = SHAPE_RULES[profile.shape];
  const heightRules = HEIGHT_RULES[profile.height];

  let prompt = `BODY-AWARE STYLING (follow these fit guidelines):
Body shape: ${profile.shape} | Height: ${profile.height} | Fit preference: ${profile.fitPreference}

SILHOUETTE RULES:
- Best silhouettes: ${rules.bestSilhouettes.join(", ")}
- Avoid: ${rules.avoidSilhouettes.join(", ")}
- Top guidance: ${rules.topRules}
- Bottom guidance: ${rules.bottomRules}
- Outerwear: ${rules.outerwearRules}
- ${rules.proportionTip}

HEIGHT ADJUSTMENT: ${heightRules}

FIT PREFERENCE: User prefers ${profile.fitPreference} fits — adjust all selections toward ${profile.fitPreference === "fitted" ? "structured, tailored, body-conscious" : profile.fitPreference === "relaxed" ? "comfortable, easy, slightly loose" : "dramatically oversized, voluminous"} pieces.`;

  if (profile.highlight.length > 0) {
    prompt += `\nHIGHLIGHT: Draw attention to: ${profile.highlight.join(", ")} — use color, detail, or fit to emphasize these areas.`;
  }
  if (profile.minimize.length > 0) {
    prompt += `\nMINIMIZE: De-emphasize: ${profile.minimize.join(", ")} — use dark colors, simple lines, and strategic layering on these areas.`;
  }

  return prompt;
}

// ─── Self-assessment helper ─────────────────────────
// For the quiz/onboarding — describes each shape in user-friendly language
export const BODY_SHAPE_DESCRIPTIONS: Record<BodyShape, { label: string; description: string; visual: string }> = {
  hourglass: {
    label: "Hourglass",
    description: "Your shoulders and hips are about the same width, with a clearly defined waist",
    visual: "Balanced top and bottom with a narrow middle",
  },
  pear: {
    label: "Pear",
    description: "Your hips are wider than your shoulders, with a defined waist",
    visual: "Narrower on top, wider on the bottom",
  },
  apple: {
    label: "Apple",
    description: "You carry weight around your midsection, with slimmer legs and arms",
    visual: "Fuller through the middle, leaner limbs",
  },
  rectangle: {
    label: "Rectangle",
    description: "Your shoulders, waist, and hips are similar in width — a straight up-and-down shape",
    visual: "Balanced and straight, minimal waist definition",
  },
  inverted_triangle: {
    label: "Inverted Triangle",
    description: "Your shoulders are broader than your hips, often with an athletic upper body",
    visual: "Wider on top, narrower on the bottom",
  },
  athletic: {
    label: "Athletic",
    description: "Toned and muscular build, typically with minimal curves and strong shoulders",
    visual: "Strong, defined physique with balanced proportions",
  },
};
