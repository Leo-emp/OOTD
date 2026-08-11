// POST /api/seed — runs all seed scripts (genres, catalog, challenges, feed)
// Protected by CRON_SECRET — call after deploy to populate empty DB
// Idempotent: safe to call multiple times, each seed checks for existing data

import { NextRequest, NextResponse } from "next/server";
import { seedGenres } from "@/lib/db/seed-genres";
import { seedCatalog } from "@/lib/db/seed-catalog";
import { seedChallenges } from "@/lib/db/seed-challenges";
import { seedFeed } from "@/lib/db/seed-feed";

export async function POST(request: NextRequest) {
  // Auth check — fail closed
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Seed] CRON_SECRET not configured — refusing request");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    // 1. Genre rulesets — must be first (other seeds reference genres)
    console.log("[Seed] Seeding genres...");
    await seedGenres();
    results.genres = "done";
  } catch (err) {
    console.error("[Seed] Genre seed failed:", err);
    results.genres = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  try {
    // 2. Catalog items — 750+ products across 12 genres
    console.log("[Seed] Seeding catalog...");
    await seedCatalog();
    results.catalog = "done";
  } catch (err) {
    console.error("[Seed] Catalog seed failed:", err);
    results.catalog = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  try {
    // 3. Style challenges — 12 challenges across genres
    console.log("[Seed] Seeding challenges...");
    await seedChallenges();
    results.challenges = "done";
  } catch (err) {
    console.error("[Seed] Challenge seed failed:", err);
    results.challenges = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  try {
    // 4. Editorial feed posts — prevents cold-start empty feed
    console.log("[Seed] Seeding editorial feed...");
    await seedFeed();
    results.feed = "done";
  } catch (err) {
    console.error("[Seed] Feed seed failed:", err);
    results.feed = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  const allOk = Object.values(results).every((v) => v === "done");
  console.log(`[Seed] Complete — ${allOk ? "all succeeded" : "some failures"}`);

  return NextResponse.json({ success: allOk, results });
}
