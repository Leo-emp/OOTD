import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProvider, CandidateItem, UserPreferences, QuizAnswer } from "./provider";
import type { GenreRuleset } from "@/types/genre";
import { AiOutfitResponseSchema, AiClothingAnalysisSchema, AiOutfitRatingSchema, AiStyleQuizResultSchema } from "@/types/ai";
import { buildOutfitPrompt, buildClothingAnalysisPrompt, buildRatingPrompt, buildQuizPrompt } from "./prompts";

// Lazy-initialized Gemini clients — avoids crash at build time
let _genai: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!_genai) _genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return _genai;
}

function getFlash() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20",
    generationConfig: { responseMimeType: "application/json" },
  });
}

function getFlashChat() {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20",
  });
}

export const geminiProvider: AiProvider = {
  async generateOutfits({ genre, candidateItems, occasion, weather, userPreferences, bodyProfile, colorProfile }) {
    const prompt = buildOutfitPrompt(genre, candidateItems, occasion, weather, userPreferences, { bodyProfile, colorProfile });
    const result = await getFlash().generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    // Validate against schema — throws if Gemini returned bad data
    return AiOutfitResponseSchema.parse(parsed);
  },

  async analyzeClothing(imageBase64: string) {
    const prompt = buildClothingAnalysisPrompt();
    const result = await getFlash().generateContent([
      prompt,
      { inlineData: { mimeType: "image/webp", data: imageBase64 } },
    ]);
    const parsed = JSON.parse(result.response.text());
    return AiClothingAnalysisSchema.parse(parsed);
  },

  async rateOutfit({ imageBase64, genre }) {
    const prompt = buildRatingPrompt(genre);
    const result = await getFlash().generateContent([
      prompt,
      { inlineData: { mimeType: "image/webp", data: imageBase64 } },
    ]);
    const parsed = JSON.parse(result.response.text());
    return AiOutfitRatingSchema.parse(parsed);
  },

  async analyzeQuizResults(answers: QuizAnswer[]) {
    const prompt = buildQuizPrompt(answers);
    const result = await getFlash().generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return AiStyleQuizResultSchema.parse(parsed);
  },

  async *chatStream({ messages, systemPrompt, imageBase64 }) {
    // Build content parts for Gemini chat format
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const chat = getFlashChat().startChat({
      systemInstruction: systemPrompt,
      history: contents.slice(0, -1), // all except the last message
    });

    // Last message — may include an image
    const lastMsg = messages[messages.length - 1];
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: lastMsg.content },
    ];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: "image/webp", data: imageBase64 } });
    }

    // Stream the response chunk by chunk
    const result = await chat.sendMessageStream(parts);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  },
};
