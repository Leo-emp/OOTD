import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { outfitRatings } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

// Validate incoming rating request
const RateSchema = z.object({
  outfitId: z.string(),
  rating: z.enum(["love", "skip", "hate"]),
});

// POST /api/outfits/rate — record user's feedback on an outfit
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rating data" }, { status: 400 });
  }

  const { outfitId, rating } = parsed.data;

  // Store the rating — feeds into preference learning
  await db.insert(outfitRatings).values({
    id: nanoid(),
    userId: session.user.id,
    outfitId,
    rating,
  });

  return NextResponse.json({ success: true });
}
