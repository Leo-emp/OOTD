// ── Glow-Up API ──
// Analyzes an outfit photo and returns improvement suggestions
// Uses Gemini vision to compare current outfit against target genre
// Returns: current score, potential score, specific improvement moves

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const genre = formData.get("genre") as string;

    if (!image || !genre) {
      return NextResponse.json({ error: "Image and genre required" }, { status: 400 });
    }

    // Convert image to base64 for Gemini
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";

    // Call Gemini vision for outfit analysis
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const genreName = genre.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const result = await model.generateContent([
      {
        inlineData: { mimeType, data: base64 },
      },
      {
        text: `You are a brutally honest fashion expert. Analyze this outfit photo and compare it to the "${genreName}" style genre.

Return a JSON object with exactly this structure:
{
  "currentScore": <number 1-10, how well the current outfit scores overall>,
  "potentialScore": <number, realistic improved score if they follow your suggestions, max 10>,
  "improvements": [
    {
      "category": "<e.g. Tops, Bottoms, Shoes, Accessories, Color Palette, Fit, Layering>",
      "suggestion": "<specific actionable suggestion, 1-2 sentences>",
      "impact": "<high|medium|low>"
    }
  ],
  "overallFeedback": "<2-3 sentence overall assessment>",
  "styleDirection": "<1-2 sentence description of the style direction they should take to nail ${genreName}>"
}

Be specific and actionable. Include 3-5 improvements sorted by impact. Return ONLY valid JSON.`,
      },
    ]);

    const text = result.response.text();
    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Glow-up analysis failed:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
