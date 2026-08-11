// POST /api/pinterest/vibe-match — analyze a Pinterest board/pin and map to genres
// Accepts: { url: "pinterest.com/..." } or { boardId: "..." }
// Returns: genre percentages, color palette, aesthetic description, style notes

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { pinterestConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchBoardPins, fetchPin, parsePinterestUrl } from "@/lib/pinterest/client";
import { analyzeBoard, analyzePinImage } from "@/lib/pinterest/vibe-match";
import { checkRateLimit, visionRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { z } from "zod";

// Validate request body — must provide either a URL or boardId
const VibeMatchSchema = z.object({
  url: z.string().url().max(500).optional(),
  boardId: z.string().regex(/^[A-Za-z0-9_\-/]{1,128}$/).optional(),
}).refine((data) => data.url || data.boardId, {
  message: "Provide a URL or boardId",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit — Gemini AI analysis is expensive
    const plan = await getUserPlan(session.user.id);
    const { success } = await checkRateLimit(visionRateLimit[plan], session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Daily vibe match limit reached. Upgrade to Pro for more." }, { status: 429 });
    }

    // Get user's Pinterest token
    const connection = await db.query.pinterestConnections.findFirst({
      where: eq(pinterestConnections.userId, session.user.id),
    });

    if (!connection) {
      return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const parsed = VibeMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }

    const { url, boardId } = parsed.data;

    // Option 1: Analyze by URL (board or pin)
    if (url) {
      const urlParsed = parsePinterestUrl(url);
      if (!urlParsed) {
        return NextResponse.json({ error: "Invalid Pinterest URL" }, { status: 400 });
      }

      if (urlParsed.type === "pin") {
        // Single pin analysis — use vision model
        const pin = await fetchPin(connection.accessToken, urlParsed.id);
        const result = await analyzePinImage(pin.imageUrl);
        return NextResponse.json({ ...result, type: "pin", pinTitle: pin.title });
      }

      // Board analysis — fetch pins and analyze as batch
      const pins = await fetchBoardPins(connection.accessToken, urlParsed.id);
      const result = await analyzeBoard(pins);
      return NextResponse.json({ ...result, type: "board", pinCount: pins.length });
    }

    // Option 2: Analyze by board ID (from board selector UI)
    if (boardId) {
      const pins = await fetchBoardPins(connection.accessToken, boardId);
      const result = await analyzeBoard(pins);
      return NextResponse.json({ ...result, type: "board", pinCount: pins.length });
    }

    return NextResponse.json({ error: "Provide a URL or boardId" }, { status: 400 });
  } catch (err) {
    console.error("[Pinterest] Vibe match failed:", err);
    return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 500 });
  }
}
