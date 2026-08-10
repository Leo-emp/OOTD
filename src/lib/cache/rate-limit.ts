import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Different rate limits per feature and plan
// Free users get stricter limits to encourage upgrade
export const outfitRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 d"), // 3 outfits per day
    prefix: "rl:outfit:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 d"), // 50 per day
    prefix: "rl:outfit:pro",
  }),
};

export const chatRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 d"), // 5 messages per day
    prefix: "rl:chat:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 d"), // 200 per day
    prefix: "rl:chat:pro",
  }),
};

export const uploadRateLimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 d"), // 20 uploads per day
    prefix: "rl:upload:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 d"), // 50 per day
    prefix: "rl:upload:pro",
  }),
};

// Generic rate limit check — returns success + remaining count
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
