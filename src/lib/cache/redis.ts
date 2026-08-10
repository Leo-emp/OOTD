import { Redis } from "@upstash/redis";

// Lazy-initialized Upstash Redis — avoids crash at build time
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Type-safe cache get — returns null on miss
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

// Cache set with TTL in seconds
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: ttlSeconds });
  } catch {
    // Cache failure is non-fatal
  }
}

// Invalidate a single key
export async function cacheInvalidate(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // Cache failure is non-fatal
  }
}
