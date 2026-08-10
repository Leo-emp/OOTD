import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { genreRulesets, chatHistory, wardrobeItems, styleProfiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { geminiProvider } from "@/lib/ai/fallback";
import { buildStylistSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, chatRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";

// GET /api/chat — load persisted chat history for the client
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load last 50 messages (newest first from DB, then reverse for chronological display)
  const rows = await db.query.chatHistory.findMany({
    where: eq(chatHistory.userId, session.user.id),
    orderBy: desc(chatHistory.createdAt),
    limit: 50,
  });

  // Return oldest-first so the client renders top-to-bottom correctly
  const messages = rows.reverse().map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.message,
    createdAt: row.createdAt,
  }));

  return NextResponse.json({ messages });
}

// POST /api/chat — streaming SSE endpoint for stylist chat
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit check — Pro users get higher limits
  const plan = await getUserPlan(session.user.id);
  const { success } = await checkRateLimit(chatRateLimit[plan], session.user.id);
  if (!success) {
    return new Response(JSON.stringify({ error: "Daily chat limit reached. Upgrade to Pro for 200/day." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { message, genreSlug, imageBase64 } = body;

  if (!message || !genreSlug) {
    return new Response("Missing message or genre", { status: 400 });
  }

  // Get genre ruleset for system prompt
  const genre = await db.query.genreRulesets.findFirst({
    where: eq(genreRulesets.slug, genreSlug),
  });
  if (!genre) {
    return new Response("Genre not found", { status: 404 });
  }

  // Get recent chat history from DB (last 10 messages for context)
  const history = await db.query.chatHistory.findMany({
    where: eq(chatHistory.userId, session.user.id),
    orderBy: (h, { desc }) => desc(h.createdAt),
    limit: 10,
  });

  // Build message array for Gemini
  const messages = [
    ...history.reverse().map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.message,
    })),
    { role: "user" as const, content: message },
  ];

  // Save user message to DB
  await db.insert(chatHistory).values({
    id: nanoid(),
    userId: session.user.id,
    role: "user",
    message,
    contextGenre: genreSlug,
    imageUrl: imageBase64 ? "image_attached" : null,
  });

  // Fetch the user's wardrobe so the stylist knows what they own
  const wardrobe = await db.query.wardrobeItems.findMany({
    where: and(
      eq(wardrobeItems.userId, session.user.id),
      eq(wardrobeItems.status, "ready"),
    ),
  });
  const wardrobeSummary = wardrobe.length > 0
    ? `USER'S WARDROBE (${wardrobe.length} items they own):\n` +
      wardrobe.map((w) => `- ${w.category || "item"}: ${w.color || "unknown"} ${w.pattern || ""} (genres: ${(w.genreTags as string[] || []).join(", ") || "untagged"})`).join("\n")
    : undefined;

  // Fetch style profile for extra personalization
  const profile = await db.query.styleProfiles.findFirst({
    where: eq(styleProfiles.userId, session.user.id),
  });
  const profileSummary = profile
    ? `Primary genre: ${profile.primaryGenre}, Secondary: ${profile.secondaryGenre || "none"}, Budget: $${profile.budgetMin}-$${profile.budgetMax}, Lifestyle: ${profile.lifestyle || "not set"}`
    : undefined;

  // Build system prompt with genre personality + wardrobe + profile context
  const genreRuleset = { ...genre, isActive: genre.isActive ?? undefined, moodImageUrl: genre.moodImageUrl ?? undefined };
  const systemPrompt = buildStylistSystemPrompt(genreRuleset, profileSummary, wardrobeSummary);

  // Stream response via SSE
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of geminiProvider.chatStream({
          messages,
          systemPrompt,
          imageBase64,
        })) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }

        // Save assistant response to DB after streaming completes
        await db.insert(chatHistory).values({
          id: nanoid(),
          userId: session.user.id,
          role: "assistant",
          message: fullResponse,
          contextGenre: genreSlug,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("[Chat] Streaming error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
