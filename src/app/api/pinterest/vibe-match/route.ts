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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's Pinterest token
  const connection = await db.query.pinterestConnections.findFirst({
    where: eq(pinterestConnections.userId, session.user.id),
  });

  if (!connection) {
    return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 });
  }

  const body = await request.json();
  const { url, boardId } = body as { url?: string; boardId?: string };

  try {
    // Option 1: Analyze by URL (board or pin)
    if (url) {
      const parsed = parsePinterestUrl(url);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid Pinterest URL" }, { status: 400 });
      }

      if (parsed.type === "pin") {
        // Single pin analysis — use vision model
        const pin = await fetchPin(connection.accessToken, parsed.id);
        const result = await analyzePinImage(pin.imageUrl);
        return NextResponse.json({ ...result, type: "pin", pinTitle: pin.title });
      }

      // Board analysis — fetch pins and analyze as batch
      const pins = await fetchBoardPins(connection.accessToken, parsed.id);
      const result = await analyzeBoard(pins);
      return NextResponse.json({ ...result, type: "board", pinCount: pins.length });
    }

    // Option 2: Analyze by board ID (from board selector UI)
    if (boardId) {
      if (!/^[A-Za-z0-9_\-\/]{1,128}$/.test(boardId)) {
        return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
      }
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
