// POST /api/engagement — batch-record implicit engagement signals
// Called by the client when user interacts with outfits (view, click, save, share)
// Lighter weight than explicit ratings but accumulates into the same preference model

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { processEngagementSignals, type SignalType, type EngagementSignal } from "@/lib/styling/engagement";
import { z } from "zod";

const SignalSchema = z.object({
  type: z.enum(["view", "click_item", "click_buy", "save", "share", "flatlay", "unsave", "time_long"]),
  itemColor: z.string().optional(),
  itemBrand: z.string().optional(),
  itemCategory: z.string().optional(),
  itemPrice: z.number().optional(),
  genreSlug: z.string().optional(),
});

const BatchSchema = z.object({
  signals: z.array(SignalSchema).min(1).max(50),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof BatchSchema>;
  try {
    body = BatchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid signals" }, { status: 400 });
  }

  // Process signals in the background — don't block the response
  const signals: EngagementSignal[] = body.signals.map((s) => ({
    type: s.type as SignalType,
    itemColor: s.itemColor,
    itemBrand: s.itemBrand,
    itemCategory: s.itemCategory,
    itemPrice: s.itemPrice,
    genreSlug: s.genreSlug,
  }));

  // Fire-and-forget — engagement tracking should never block UX
  processEngagementSignals(session.user.id, signals).catch((e) =>
    console.error("[Engagement] Processing failed:", e)
  );

  return NextResponse.json({ recorded: signals.length });
}
