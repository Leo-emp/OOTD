// ── RAG Embedding Engine ──
// Generates and queries text embeddings using Gemini's embedding model
// Used for semantic similarity search on catalog items
// Pattern: embed item descriptions → store in DB → cosine similarity at query time

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "@/lib/env";
import { db } from "@/lib/db";
import { catalogItems, catalogEmbeddings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// Gemini embedding model — 768-dim vectors, free tier available
const EMBEDDING_MODEL = "text-embedding-004";

// Lazy-init Gemini client
let _genai: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!_genai) _genai = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
  return _genai;
}

// Generate a single embedding vector from text
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Generate embeddings in batch (up to 100 texts at once)
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { role: "user", parts: [{ text }] },
    })),
  });
  return result.embeddings.map((e) => e.values);
}

// Build a rich text description of a catalog item for embedding
// Captures semantic meaning: what it looks like, what genre, what occasion
function itemToEmbeddingText(item: {
  name: string;
  brand: string;
  category: string;
  color: string;
  pattern?: string | null;
  genreTags: string[];
  season?: string | null;
}): string {
  return [
    item.name,
    `by ${item.brand}`,
    item.category,
    `${item.color} color`,
    item.pattern && item.pattern !== "solid" ? `${item.pattern} pattern` : null,
    `style: ${item.genreTags.join(", ")}`,
    item.season ? `for ${item.season}` : null,
  ]
    .filter(Boolean)
    .join(". ");
}

// Embed all catalog items that don't have embeddings yet
// Run as a one-time job or cron to keep embeddings fresh
export async function embedCatalogItems(): Promise<number> {
  // Find items without embeddings
  const items = await db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      brand: catalogItems.brand,
      category: catalogItems.category,
      color: catalogItems.color,
      pattern: catalogItems.pattern,
      genreTags: catalogItems.genreTags,
      season: catalogItems.season,
    })
    .from(catalogItems)
    .leftJoin(catalogEmbeddings, eq(catalogItems.id, catalogEmbeddings.itemId))
    .where(sql`${catalogEmbeddings.itemId} IS NULL`)
    .limit(100);

  if (items.length === 0) return 0;

  // Generate embedding text for each item
  const texts = items.map((item) => itemToEmbeddingText(item));

  // Batch embed — Gemini supports up to 100 at once
  const vectors = await generateEmbeddingsBatch(texts);

  // Store embeddings in DB
  for (let i = 0; i < items.length; i++) {
    await db.insert(catalogEmbeddings).values({
      itemId: items[i].id,
      embedding: JSON.stringify(vectors[i]),
    }).onConflictDoUpdate({
      target: catalogEmbeddings.itemId,
      set: { embedding: JSON.stringify(vectors[i]) },
    });
  }

  return items.length;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic search — find catalog items similar to a text query
// Returns top-K items ranked by cosine similarity to the query embedding
export async function semanticSearch(
  query: string,
  topK: number = 10,
  minScore: number = 0.5
): Promise<{ itemId: string; score: number }[]> {
  // Embed the query text
  const queryVector = await generateEmbedding(query);

  // Fetch all embeddings from DB (for <10K items, in-memory cosine is fine)
  // For 10K+ items, switch to sqlite-vec or Qdrant
  const allEmbeddings = await db
    .select({
      itemId: catalogEmbeddings.itemId,
      embedding: catalogEmbeddings.embedding,
    })
    .from(catalogEmbeddings);

  // Score each item by cosine similarity to query
  const scored = allEmbeddings
    .map((row) => ({
      itemId: row.itemId,
      score: cosineSimilarity(queryVector, JSON.parse(row.embedding) as number[]),
    }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// Find items similar to a specific catalog item
// Used for "similar items" and "complete this outfit" features
export async function findSimilarItems(
  itemId: string,
  topK: number = 5,
  excludeIds: string[] = []
): Promise<{ itemId: string; score: number }[]> {
  // Get the item's embedding
  const row = await db
    .select({ embedding: catalogEmbeddings.embedding })
    .from(catalogEmbeddings)
    .where(eq(catalogEmbeddings.itemId, itemId))
    .get();

  if (!row) return [];

  const itemVector = JSON.parse(row.embedding) as number[];

  // Compare against all other embeddings
  const allEmbeddings = await db
    .select({
      itemId: catalogEmbeddings.itemId,
      embedding: catalogEmbeddings.embedding,
    })
    .from(catalogEmbeddings);

  const excludeSet = new Set([itemId, ...excludeIds]);

  const scored = allEmbeddings
    .filter((r) => !excludeSet.has(r.itemId))
    .map((row) => ({
      itemId: row.itemId,
      score: cosineSimilarity(itemVector, JSON.parse(row.embedding) as number[]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
