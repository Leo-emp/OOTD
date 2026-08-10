// Plan checker — returns user's current subscription tier
// Used by rate limiting, feature gates, and UI display

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Plan = "free" | "pro";

// Get user's active plan — defaults to "free" if no subscription record
export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!sub) return "free";
  if (sub.plan !== "pro") return "free";
  if (sub.status !== "active") return "free";

  // Check if subscription has expired
  if (sub.currentPeriodEnd) {
    const endDate = new Date(sub.currentPeriodEnd);
    if (endDate < new Date()) return "free";
  }

  return "pro";
}

// Check if user has Pro features available
export async function isPro(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "pro";
}
