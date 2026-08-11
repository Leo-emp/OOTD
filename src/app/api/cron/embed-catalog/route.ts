// POST /api/cron/embed-catalog — generates embeddings for new catalog items
// Called by Vercel Cron or manually via CRON_SECRET
// Processes up to 100 items per run — safe to call repeatedly until all embedded

import { NextRequest, NextResponse } from "next/server";
import { embedCatalogItems } from "@/lib/ai/embeddings";
import { traceAiCall } from "@/lib/observability";

export async function POST(request: NextRequest) {
  // Verify cron secret — fail closed when not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Embed up to 100 new catalog items per run
    const count = await traceAiCall(
      "embedCatalog",
      undefined,
      () => embedCatalogItems(),
      { source: "cron" }
    );

    return NextResponse.json({
      success: true,
      embedded: count,
      message: count > 0
        ? `Embedded ${count} new catalog items`
        : "All catalog items already have embeddings",
    });
  } catch (error) {
    console.error("[Cron] embed-catalog failed:", error);
    return NextResponse.json(
      { error: "Embedding generation failed" },
      { status: 500 }
    );
  }
}
