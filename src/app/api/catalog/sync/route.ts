// POST /api/catalog/sync — trigger catalog sync from ShopStyle API
// Called by: (1) Vercel cron (nightly), (2) admin manual trigger
// Protected by CRON_SECRET to prevent abuse

import { NextRequest, NextResponse } from "next/server";
import { syncAllGenres, syncGenre } from "@/lib/catalog/sync";
import { getCatalogStats } from "@/lib/catalog/search";

export async function POST(request: NextRequest) {
  // Auth check — fail closed: reject if secret not configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Catalog Sync] CRON_SECRET not configured — refusing request");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { genre } = body as { genre?: string };

  try {
    if (genre) {
      // Sync single genre
      const count = await syncGenre(genre);
      return NextResponse.json({ synced: { [genre]: count } });
    }

    // Full sync — all 12 genres
    const results = await syncAllGenres();
    return NextResponse.json({ synced: results });
  } catch (error) {
    console.error("[Catalog Sync] Failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// GET /api/catalog/sync — check catalog health (stats per genre)
// Protected — only cron/admin can view sync stats
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getCatalogStats();
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    total,
    perGenre: stats,
    healthy: total > 100,
  });
}
