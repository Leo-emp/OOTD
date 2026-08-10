// DELETE /api/user/delete — GDPR-compliant account deletion
// Removes all user data: profile, wardrobe, outfits, ratings, chat, subscriptions

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  users, styleProfiles, wardrobeItems, outfitRatings,
  chatHistory, subscriptions, userPreferencesLearned,
  outfits, outfitItems,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Delete in dependency order (children before parents)
  // Get outfit IDs first for cascade
  const userOutfits = await db.query.outfits.findMany({
    where: eq(outfits.userId, userId),
    columns: { id: true },
  });
  const outfitIds = userOutfits.map((o) => o.id);

  // Delete outfit items
  if (outfitIds.length > 0) {
    await db.delete(outfitItems).where(inArray(outfitItems.outfitId, outfitIds));
  }

  // Delete all user-owned data
  await Promise.all([
    db.delete(outfitRatings).where(eq(outfitRatings.userId, userId)),
    db.delete(outfits).where(eq(outfits.userId, userId)),
    db.delete(chatHistory).where(eq(chatHistory.userId, userId)),
    db.delete(wardrobeItems).where(eq(wardrobeItems.userId, userId)),
    db.delete(userPreferencesLearned).where(eq(userPreferencesLearned.userId, userId)),
    db.delete(styleProfiles).where(eq(styleProfiles.userId, userId)),
    db.delete(subscriptions).where(eq(subscriptions.userId, userId)),
  ]);

  // Delete the user account last
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ deleted: true });
}
