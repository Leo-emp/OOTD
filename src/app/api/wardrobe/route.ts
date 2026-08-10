import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wardrobeItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET — list user's wardrobe items
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.query.wardrobeItems.findMany({
    where: eq(wardrobeItems.userId, session.user.id),
    orderBy: desc(wardrobeItems.createdAt),
  });

  return NextResponse.json({ items });
}
