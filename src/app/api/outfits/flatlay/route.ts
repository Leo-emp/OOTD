// POST /api/outfits/flatlay — generates a flat-lay composite image from outfit items
// Accepts array of items with imageUrl + position, returns the composite as webp/png
// Optionally caches to Vercel Blob for repeat access

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { renderFlatLay, canRenderFlatLay } from "@/lib/images/flatlay";
import { checkRateLimit, flatLayRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { z } from "zod";

// Input validation — strict schema for the items array
const FlatLayRequestSchema = z.object({
  items: z.array(z.object({
    imageUrl: z.string().url(),
    position: z.enum(["top", "bottom", "shoes", "outerwear", "accessory", "bag"]),
  })).min(2).max(6),
  genreSlug: z.string().min(1).max(30),
  format: z.enum(["webp", "png", "jpeg"]).default("webp"),
  // Square (1:1) or portrait (4:5)
  aspect: z.enum(["square", "portrait"]).default("portrait"),
});

export async function POST(request: NextRequest) {
  // Auth check — only logged-in users can generate composites
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — flat-lay is CPU-heavy (Sharp compositing)
  const plan = await getUserPlan(session.user.id);
  const { success } = await checkRateLimit(flatLayRateLimit[plan], session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Daily flat-lay limit reached. Upgrade to Pro for 30/day." }, { status: 429 });
  }

  // Parse and validate request body
  let body: z.infer<typeof FlatLayRequestSchema>;
  try {
    const raw = await request.json();
    body = FlatLayRequestSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check we have enough pieces for a meaningful layout
  const positions = body.items.map((i) => i.position);
  if (!canRenderFlatLay(positions)) {
    return NextResponse.json(
      { error: "Need at least a top/outerwear + bottom or shoes" },
      { status: 400 },
    );
  }

  // Canvas dimensions based on aspect ratio
  const width = 1080;
  const height = body.aspect === "square" ? 1080 : 1350;

  try {
    // Render the composite — fetches all item images and assembles them
    const imageBuffer = await renderFlatLay({
      items: body.items,
      genreSlug: body.genreSlug,
      width,
      height,
      format: body.format,
      quality: 90,
    });

    // Return the composite image directly
    const mimeType =
      body.format === "png" ? "image/png" :
      body.format === "jpeg" ? "image/jpeg" :
      "image/webp";

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(imageBuffer.length),
        // Cache for 1 hour on CDN, 24 hours in browser
        "Cache-Control": "public, s-maxage=3600, max-age=86400",
        "Content-Disposition": `inline; filename="outfit-flatlay.${body.format}"`,
      },
    });
  } catch (err) {
    console.error("[flatlay] Render failed:", err);
    return NextResponse.json(
      { error: "Failed to generate flat-lay image" },
      { status: 500 },
    );
  }
}
