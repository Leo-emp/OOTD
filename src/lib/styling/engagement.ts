// Implicit engagement tracking — learns from behavior without requiring explicit ratings
// Captures: outfit views, item clicks, time spent, save actions
// Signals are weighted lighter than explicit love/skip/hate but accumulate over time
// Updates the same userPreferencesLearned table as the explicit rating system

import { db } from "@/lib/db";
import { userPreferencesLearned } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Signal types and their weights ─────────────────
// These are much lighter than explicit ratings (love=1.0, hate=-1.0)
// But they accumulate — 20 clicks on navy items is a strong signal
const SIGNAL_WEIGHTS = {
  view: 0.05,        // saw the outfit (very weak but high volume)
  click_item: 0.15,  // clicked on a specific item in the outfit
  click_buy: 0.3,    // clicked the affiliate/buy link (strong purchase intent)
  save: 0.4,         // saved the outfit (strong positive, just below explicit "love")
  share: 0.35,       // shared the outfit (implies they like it enough to show others)
  flatlay: 0.25,     // generated a flat-lay (invested effort = positive signal)
  unsave: -0.3,      // removed from saves (changed their mind)
  time_long: 0.1,    // spent 10+ seconds viewing (attention = interest)
};

export type SignalType = keyof typeof SIGNAL_WEIGHTS;

// ─── Single engagement event ────────────────────────
export interface EngagementSignal {
  type: SignalType;
  // What the signal is about — at least one should be provided
  itemColor?: string;
  itemBrand?: string;
  itemCategory?: string;
  itemPrice?: number;
  genreSlug?: string;
}

// ─── Process a batch of signals and update preferences ─
// Called periodically (e.g. on page unload, or every 10 signals)
export async function processEngagementSignals(
  userId: string,
  signals: EngagementSignal[],
): Promise<void> {
  if (signals.length === 0) return;

  // Load existing preferences
  const existing = await db.query.userPreferencesLearned.findFirst({
    where: eq(userPreferencesLearned.userId, userId),
  });

  // Start from existing data or empty
  const colorScores = new Map<string, number>(
    (existing?.preferredColors as string[] | null)?.map((c) => [c, 0.5]) || [],
  );
  const brandScores = new Map<string, number>(
    (existing?.preferredBrands as string[] | null)?.map((b) => [b, 0.5]) || [],
  );
  let priceSum = existing?.priceSweetSpot || 0;
  let priceCount = existing?.priceSweetSpot ? 1 : 0;

  // Process each signal
  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.type];

    if (signal.itemColor) {
      const current = colorScores.get(signal.itemColor) || 0;
      colorScores.set(signal.itemColor, current + weight);
    }

    if (signal.itemBrand) {
      const current = brandScores.get(signal.itemBrand) || 0;
      brandScores.set(signal.itemBrand, current + weight);
    }

    if (signal.itemPrice && weight > 0) {
      priceSum += signal.itemPrice;
      priceCount++;
    }
  }

  // Extract top preferences — only those with positive accumulated scores
  const preferredColors = [...colorScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color]) => color);

  const preferredBrands = [...brandScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([brand]) => brand);

  const priceSweetSpot = priceCount > 0 ? Math.round(priceSum / priceCount) : null;

  // Upsert preferences
  if (existing) {
    await db.update(userPreferencesLearned).set({
      preferredColors,
      preferredBrands,
      priceSweetSpot,
      updatedAt: new Date().toISOString(),
    }).where(eq(userPreferencesLearned.id, existing.id));
  } else {
    await db.insert(userPreferencesLearned).values({
      id: nanoid(),
      userId,
      preferredColors,
      preferredBrands,
      priceSweetSpot,
      styleVector: Array(12).fill(0),
    });
  }
}
