import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { genreRulesets, chatHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { geminiProvider } from "@/lib/ai/fallback";
import { buildStylistSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, chatRateLimit } from "@/lib/cache/rate-limit";

// POST /api/chat — streaming SSE endpoint for stylist chat
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit check
  const plan = "free"; // TODO: check subscription
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

  // Build system prompt with genre personality
  // Convert DB null values to undefined for type compat
  const genreRuleset = { ...genre, isActive: genre.isActive ?? undefined, moodImageUrl: genre.moodImageUrl ?? undefined };
  const systemPrompt = buildStylistSystemPrompt(genreRuleset);

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
