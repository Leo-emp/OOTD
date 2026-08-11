// ── Weather Outfit Suggestion API ──
// Takes weather conditions and generates outfit suggestions
// Uses Gemini AI to create weather-appropriate outfit recommendations
// Considers the user's genre preferences for personalized suggestions

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { styleProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { temp, condition, humidity } = await req.json();

    // Get user's primary genre for personalized suggestions
    const profile = await db.select().from(styleProfiles).where(eq(styleProfiles.userId, session.user.id)).get();
    const primaryGenre = profile?.primaryGenre || "minimalist";
    const genreName = primaryGenre.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    // Call Gemini for weather-smart outfit suggestions
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const result = await model.generateContent([
      {
        text: `You are a fashion stylist. Generate 3 outfit suggestions for today's weather conditions:
- Temperature: ${temp}°C (feels like ${temp}°C)
- Condition: ${condition}
- Humidity: ${humidity}%
- User's preferred style genre: ${genreName}

Return a JSON array of 3 outfit suggestions:
[
  {
    "title": "<catchy 3-4 word outfit name>",
    "description": "<1 sentence describing the vibe>",
    "items": ["<item 1>", "<item 2>", "<item 3>", "<item 4>"],
    "tip": "<1 sentence weather-specific styling tip>",
    "genre": "${primaryGenre}"
  }
]

Make outfits practical for the weather but stylish. Mix weather-appropriate pieces with ${genreName} aesthetic. Return ONLY valid JSON array.`,
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Weather suggest failed:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
