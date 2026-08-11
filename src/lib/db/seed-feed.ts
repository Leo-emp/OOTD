// Editorial feed seed — pre-populates community feed with curated outfit posts
// Prevents empty-feed cold start for new users
// Run: npx tsx src/lib/db/seed-feed.ts (or auto-run via /api/seed)

import { db } from "./index";
import { outfitPosts } from "./schema";
import { nanoid } from "nanoid";

// Editorial posts — styled outfit photography placeholders
// These represent "OOTD AI" editorial picks that make the feed feel alive
// Each has a distinct genre, realistic caption, and engagement metrics
interface EditorialPost {
  caption: string;
  genreSlug: string;
  likesCount: number;
  commentsCount: number;
  daysAgo: number; // how many days in the past
}

const EDITORIAL_POSTS: EditorialPost[] = [
  // Old Money
  {
    caption: "Sunday brunch uniform: cashmere, linen, loafers. Some combinations never fail.",
    genreSlug: "old-money",
    likesCount: 47,
    commentsCount: 8,
    daysAgo: 1,
  },
  {
    caption: "Navy blazer season is every season.",
    genreSlug: "old-money",
    likesCount: 32,
    commentsCount: 5,
    daysAgo: 3,
  },
  // Streetwear
  {
    caption: "Air Force 1s with the tech fleece — classic for a reason.",
    genreSlug: "streetwear",
    likesCount: 89,
    commentsCount: 14,
    daysAgo: 0,
  },
  {
    caption: "Layering game strong today. Stussy fleece over the Carhartt.",
    genreSlug: "streetwear",
    likesCount: 56,
    commentsCount: 9,
    daysAgo: 2,
  },
  // Minimalist
  {
    caption: "Black, white, grey. That's the whole palette, that's the whole vibe.",
    genreSlug: "minimalist",
    likesCount: 41,
    commentsCount: 6,
    daysAgo: 1,
  },
  {
    caption: "COS trousers + Uniqlo tee. Sometimes less really is more.",
    genreSlug: "minimalist",
    likesCount: 28,
    commentsCount: 4,
    daysAgo: 4,
  },
  // Cottagecore
  {
    caption: "Floral midi and wicker basket — farmers market ready.",
    genreSlug: "cottagecore",
    likesCount: 63,
    commentsCount: 11,
    daysAgo: 1,
  },
  // Dark Academia
  {
    caption: "Tweed blazer, turtleneck, and a stack of books. Living the aesthetic.",
    genreSlug: "dark-academia",
    likesCount: 52,
    commentsCount: 7,
    daysAgo: 2,
  },
  // Y2K
  {
    caption: "Low-rise is back and I'm not sorry. Butterfly clips optional but recommended.",
    genreSlug: "y2k",
    likesCount: 74,
    commentsCount: 12,
    daysAgo: 0,
  },
  // Clean Girl
  {
    caption: "Gold hoops, slicked bun, matching set. Clean girl energy activated.",
    genreSlug: "clean-girl",
    likesCount: 68,
    commentsCount: 10,
    daysAgo: 1,
  },
  // Gorpcore
  {
    caption: "Arc'teryx shell + Salomon XT-6. City hike ready.",
    genreSlug: "gorpcore",
    likesCount: 45,
    commentsCount: 6,
    daysAgo: 3,
  },
  // Coquette
  {
    caption: "Bows, ballet flats, and a touch of pink. Soft girl spring.",
    genreSlug: "coquette",
    likesCount: 58,
    commentsCount: 9,
    daysAgo: 2,
  },
  // Grunge
  {
    caption: "Doc Martens + flannel + attitude. Some things are timeless.",
    genreSlug: "grunge",
    likesCount: 39,
    commentsCount: 5,
    daysAgo: 4,
  },
  // Coastal Grandma
  {
    caption: "Linen everything. Espadrilles. The sound of waves. Peak summer dressing.",
    genreSlug: "coastal-grandma",
    likesCount: 44,
    commentsCount: 7,
    daysAgo: 1,
  },
  // Indie Boho
  {
    caption: "Free People top, vintage Levi's, fringe bag. Festival-ready all year.",
    genreSlug: "indie-boho",
    likesCount: 51,
    commentsCount: 8,
    daysAgo: 3,
  },
];

// "OOTD Editorial" system user ID — used for all seeded posts
// This user is created in the seed function if it doesn't exist
const EDITORIAL_USER_ID = "ootd-editorial";
const EDITORIAL_USER_NAME = "OOTD Editorial";

export async function seedFeed() {
  // Check if editorial posts already exist
  const existing = await db.query.outfitPosts.findFirst({
    where: (posts, { eq }) => eq(posts.userId, EDITORIAL_USER_ID),
  });
  if (existing) {
    console.log("  Editorial feed posts already seeded — skipping");
    return;
  }

  // Insert editorial posts with staggered timestamps
  let inserted = 0;
  for (const post of EDITORIAL_POSTS) {
    const createdAt = new Date(Date.now() - post.daysAgo * 86400000);
    // Add random hours offset for natural-looking timestamps
    createdAt.setHours(8 + Math.floor(Math.abs(hashCode(post.caption)) % 12));
    createdAt.setMinutes(Math.floor(Math.abs(hashCode(post.genreSlug + post.caption)) % 60));

    await db.insert(outfitPosts).values({
      id: nanoid(),
      userId: EDITORIAL_USER_ID,
      imageUrl: generateEditorialImage(post.genreSlug),
      caption: post.caption,
      genreSlug: post.genreSlug,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      createdAt: createdAt.toISOString(),
    });
    inserted++;
  }

  console.log(`  Seeded ${inserted} editorial feed posts across ${new Set(EDITORIAL_POSTS.map(p => p.genreSlug)).size} genres`);
}

// Placeholder images for editorial posts — styled per genre
function generateEditorialImage(genreSlug: string): string {
  const genreColors: Record<string, string> = {
    "old-money": "1C3144",
    "y2k": "FF69B4",
    "streetwear": "111111",
    "minimalist": "2D2D2D",
    "cottagecore": "C4A882",
    "dark-academia": "3C2415",
    "coastal-grandma": "87CEEB",
    "grunge": "2C2C2C",
    "coquette": "FFB6C1",
    "gorpcore": "1B3A4B",
    "clean-girl": "C9B99A",
    "indie-boho": "8B6914",
  };
  const bg = genreColors[genreSlug] || "1a1a2e";
  const label = encodeURIComponent(genreSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "));
  return `https://placehold.co/800x1067/${bg}/ffffff?text=OOTD%0A${label}`;
}

// Simple string hash for deterministic "random" offsets
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Run directly
if (require.main === module) {
  seedFeed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Feed seed failed:", e);
      process.exit(1);
    });
}
