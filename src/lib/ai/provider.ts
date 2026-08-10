import type { AiOutfitResponse, AiClothingAnalysis, AiOutfitRating, AiStyleQuizResult } from "@/types/ai";
import type { GenreRuleset } from "@/types/genre";

// Abstract interface — swap Gemini for Claude by implementing this
export interface AiProvider {
  // Generate outfit combinations from candidate items
  generateOutfits(params: {
    genre: GenreRuleset;
    candidateItems: CandidateItem[];
    occasion: string;
    weather?: string;
    userPreferences?: UserPreferences;
  }): Promise<AiOutfitResponse>;

  // Analyze a clothing photo — is it clothing? what type/color/genre?
  analyzeClothing(imageBase64: string): Promise<AiClothingAnalysis>;

  // Rate a user's outfit photo against a genre
  rateOutfit(params: {
    imageBase64: string;
    genre: GenreRuleset;
  }): Promise<AiOutfitRating>;

  // Analyze quiz answers and determine genre breakdown
  analyzeQuizResults(answers: QuizAnswer[]): Promise<AiStyleQuizResult>;

  // Streaming chat — returns async iterable of text chunks
  chatStream(params: {
    messages: { role: "user" | "assistant"; content: string }[];
    systemPrompt: string;
    imageBase64?: string;
  }): AsyncIterable<string>;
}

// Supporting types used across the AI layer
export interface CandidateItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  color: string;
  genreTags: string[];
  // Optional wardrobe fields — set when the item is from the user's closet
  isWardrobe?: boolean;
  imageUrl?: string;
}

export interface UserPreferences {
  preferredColors?: string[];
  preferredBrands?: string[];
  priceSweetSpot?: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: string;
  imageChosen?: string;
}
