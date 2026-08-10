import { Redis } from "@upstash/redis";

// Upstash Redis — serverless, edge-compatible
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Type-safe cache get — returns null on miss
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get<T>(key);
  return data ?? null;
}

// Cache set with TTL in seconds
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

// Invalidate a single key
export async function cacheInvalidate(key: string): Promise<void> {
  await redis.del(key);
}
