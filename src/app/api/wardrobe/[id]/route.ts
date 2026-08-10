import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wardrobeItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// DELETE — remove wardrobe item (verifies ownership)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only delete if the item belongs to this user
  const deleted = await db
    .delete(wardrobeItems)
    .where(and(eq(wardrobeItems.id, id), eq(wardrobeItems.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
