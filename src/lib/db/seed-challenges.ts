// Seed predefined style challenges — run once during setup
// Each challenge encourages users to try a genre for multiple days

import { db } from "./index";
import { challenges } from "./schema";
import { nanoid } from "nanoid";

const CHALLENGES = [
  {
    title: "Old Money Weekend",
    description: "Channel quiet luxury for 3 days. Think Polo Ralph Lauren, not logos.",
    genreSlug: "old-money",
    durationDays: 3,
    difficulty: "easy",
    badgeEmoji: "🎩",
    dailyTips: [
      "Day 1: Start with a crisp button-down or knit polo. Pair with chinos and loafers.",
      "Day 2: Layer up — blazer over a turtleneck with tailored trousers.",
      "Day 3: Go full prep — sweater draped over shoulders, pressed khakis, minimal jewelry.",
    ],
  },
  {
    title: "Minimalist Reset",
    description: "Strip it back to essentials. 5 days of clean lines and neutral tones.",
    genreSlug: "minimalist",
    durationDays: 5,
    difficulty: "medium",
    badgeEmoji: "⬜",
    dailyTips: [
      "Day 1: White tee, black straight-leg pants, clean sneakers. That's it.",
      "Day 2: Monochrome outfit — pick one color and build the full look around it.",
      "Day 3: Oversized silhouette day — relaxed blazer with wide-leg trousers.",
      "Day 4: Texture play — same neutrals but mix knit, cotton, and leather.",
      "Day 5: Your signature minimalist look — the outfit you'd wear every day.",
    ],
  },
  {
    title: "Streetwear Heat",
    description: "7 days of street culture. Sneakers, oversized fits, bold graphics.",
    genreSlug: "streetwear",
    durationDays: 7,
    difficulty: "hard",
    badgeEmoji: "🔥",
    dailyTips: [
      "Day 1: Statement sneaker day — build the whole outfit around your best kicks.",
      "Day 2: Graphic tee + cargo pants. Keep it authentic.",
      "Day 3: Hoodie layering — hoodie under a jacket, visible hood.",
      "Day 4: All-black street look. Let silhouette and fit do the talking.",
      "Day 5: Color pop — one bold colorful piece, rest neutral.",
      "Day 6: Accessories focus — caps, chains, bags. Style the details.",
      "Day 7: Your ultimate street outfit. Everything you've learned this week.",
    ],
  },
  {
    title: "Cottagecore Dreamer",
    description: "3 days of floral prints, linen, and countryside charm.",
    genreSlug: "cottagecore",
    durationDays: 3,
    difficulty: "easy",
    badgeEmoji: "🌸",
    dailyTips: [
      "Day 1: Floral dress or skirt with a straw bag. Embrace the countryside.",
      "Day 2: Linen everything — relaxed linen top with flowing pants or a midi skirt.",
      "Day 3: Layer a knit cardigan over a white blouse. Add a ribbon or vintage brooch.",
    ],
  },
  {
    title: "Dark Academia Deep Dive",
    description: "5 days channeling the intellectual aesthetic. Libraries, leather, and layers.",
    genreSlug: "dark-academia",
    durationDays: 5,
    difficulty: "medium",
    badgeEmoji: "📚",
    dailyTips: [
      "Day 1: Tweed or wool blazer over a turtleneck. Dark brown or olive tones.",
      "Day 2: Plaid and patterns — argyle sweater or plaid trousers.",
      "Day 3: Leather accessories — boots, belt, bag. Keep it vintage.",
      "Day 4: Layering mastery — shirt under sweater under coat.",
      "Day 5: Full dark academia — your most bookish, scholarly outfit.",
    ],
  },
  {
    title: "Y2K Revival",
    description: "3 days of early 2000s nostalgia. Low-rise, butterfly clips, and shimmer.",
    genreSlug: "y2k",
    durationDays: 3,
    difficulty: "easy",
    badgeEmoji: "💿",
    dailyTips: [
      "Day 1: Baby tee + low-rise jeans or mini skirt. Add a chunky belt.",
      "Day 2: Sparkle and shimmer — metallics, sequins, or iridescent fabrics.",
      "Day 3: Go full Y2K — butterfly accessories, platform shoes, bright colors.",
    ],
  },
  {
    title: "Coastal Grandma Getaway",
    description: "5 days of seaside elegance. Think Nancy Meyers movies.",
    genreSlug: "coastal-grandma",
    durationDays: 5,
    difficulty: "medium",
    badgeEmoji: "🐚",
    dailyTips: [
      "Day 1: White linen pants + striped top + espadrilles.",
      "Day 2: Oversized button-down over a simple cami with wide-leg pants.",
      "Day 3: Neutral knit + flowing skirt. Think farmers market morning.",
      "Day 4: All-white outfit with natural textures — linen, cotton, straw.",
      "Day 5: Your beach-to-dinner look — effortlessly polished and relaxed.",
    ],
  },
  {
    title: "Gorpcore Explorer",
    description: "7 days merging outdoor gear with urban style. Function meets fashion.",
    genreSlug: "gorpcore",
    durationDays: 7,
    difficulty: "hard",
    badgeEmoji: "🏔️",
    dailyTips: [
      "Day 1: Trail runners or hiking boots as your anchor piece.",
      "Day 2: Technical fabric day — nylon, Gore-Tex, or ripstop in your outfit.",
      "Day 3: Vest layering — fleece or puffer vest over a long-sleeve.",
      "Day 4: Cargo everything — pockets are not just functional, they're fashion.",
      "Day 5: Earth tones — olive, tan, brown, sage. Full nature palette.",
      "Day 6: Accessories — carabiner keychain, crossbody bag, sport watch.",
      "Day 7: Summit look — your most put-together gorpcore outfit.",
    ],
  },
  {
    title: "Grunge Weekend",
    description: "3 days of plaid, combat boots, and don't-care attitude.",
    genreSlug: "grunge",
    durationDays: 3,
    difficulty: "easy",
    badgeEmoji: "🎸",
    dailyTips: [
      "Day 1: Flannel shirt (unbuttoned or tied) + band tee + ripped jeans.",
      "Day 2: Combat boots + oversized sweater or cardigan. Layer it up.",
      "Day 3: All black + one plaid piece. Dark, moody, effortless.",
    ],
  },
  {
    title: "Indie Boho Spirit",
    description: "5 days of free-spirited fashion. Flow, fringe, and earth tones.",
    genreSlug: "indie-boho",
    durationDays: 5,
    difficulty: "medium",
    badgeEmoji: "🪶",
    dailyTips: [
      "Day 1: Flowy maxi dress or skirt with sandals. Let it move.",
      "Day 2: Fringe or tassel accent — bag, jacket, or boots.",
      "Day 3: Layered jewelry — rings, necklaces, bracelets. More is more.",
      "Day 4: Mixed prints — florals with stripes or paisley with geometric.",
      "Day 5: Your most bohemian outfit — free, eclectic, and unapologetically you.",
    ],
  },
  {
    title: "Clean Girl Glow-Up",
    description: "5 days of effortless polish. Slicked hair, gold hoops, matching sets.",
    genreSlug: "clean-girl",
    durationDays: 5,
    difficulty: "medium",
    badgeEmoji: "✨",
    dailyTips: [
      "Day 1: Matching set — coordinated top and bottom in a neutral tone.",
      "Day 2: Gold accessories only — hoops, chain, watch. Keep it simple.",
      "Day 3: Monochrome moment — one color head to toe, varied textures.",
      "Day 4: Athletic-elegant — bike shorts or leggings styled up with a blazer.",
      "Day 5: Your polished everyday look — the outfit that says 'I have my life together'.",
    ],
  },
  {
    title: "Coquette Fantasy",
    description: "3 days of ribbons, bows, and feminine charm.",
    genreSlug: "coquette",
    durationDays: 3,
    difficulty: "easy",
    badgeEmoji: "🎀",
    dailyTips: [
      "Day 1: Bow or ribbon accent — in your hair, on a bag, or at the neckline.",
      "Day 2: Soft pink or cream outfit with lace or ruffle details.",
      "Day 3: Full coquette — ballet flats, pearl earrings, delicate layers.",
    ],
  },
];

export async function seedChallenges() {
  console.log("[Seed] Seeding style challenges...");

  for (const challenge of CHALLENGES) {
    await db
      .insert(challenges)
      .values({
        id: nanoid(),
        ...challenge,
        sortOrder: CHALLENGES.indexOf(challenge),
      })
      .onConflictDoNothing();
  }

  console.log(`[Seed] ${CHALLENGES.length} challenges seeded.`);
}
