import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Different rate limits per feature and plan
// Free users get stricter limits to encourage upgrade
export const outfitRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 d"),
    prefix: "rl:outfit:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 d"),
    prefix: "rl:outfit:pro",
  }),
};

export const chatRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 d"),
    prefix: "rl:chat:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 d"),
    prefix: "rl:chat:pro",
  }),
};

export const uploadRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 d"),
    prefix: "rl:upload:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 d"),
    prefix: "rl:upload:pro",
  }),
};

// Flat-lay rendering — CPU-heavy, needs its own limit
export const flatLayRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 d"),
    prefix: "rl:flatlay:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 d"),
    prefix: "rl:flatlay:pro",
  }),
};

// Generic rate limit check — returns success + remaining count
// Falls back to ALLOW on Redis failure (but logs it) to avoid locking out all users
// In-memory counter provides a basic safety net when Redis is down
const memoryCounters = new Map<string, { count: number; resetAt: number }>();
const MEMORY_FALLBACK_LIMIT = 20; // generous per-key fallback when Redis is unreachable

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Redis is down — use in-memory counter as a basic safety net
    console.error("[Rate Limit] Redis failed, using memory fallback:", error);
    const now = Date.now();
    const key = `${identifier}:fallback`;
    let entry = memoryCounters.get(key);

    // Reset every hour
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + 3600_000 };
    }

    entry.count++;
    memoryCounters.set(key, entry);

    return {
      success: entry.count <= MEMORY_FALLBACK_LIMIT,
      remaining: Math.max(0, MEMORY_FALLBACK_LIMIT - entry.count),
      reset: entry.resetAt,
    };
  }
}
