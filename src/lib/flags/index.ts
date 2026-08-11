// ── Feature Flag System ──
// Redis-backed feature flags with deterministic user bucketing for A/B tests
// Supports: boolean flags, percentage rollouts, A/B/C variant tests
// No external service needed — uses existing Upstash Redis

import { redis } from "@/lib/cache/redis";

// Flag definition stored in Redis as JSON
interface FlagDefinition {
  // Unique flag identifier
  key: string;
  // Is this flag active at all?
  enabled: boolean;
  // Percentage of users who see this flag (0-100)
  // Used for gradual rollouts — start at 10%, increase to 100%
  rolloutPercentage: number;
  // A/B test variants — when set, users get assigned a variant
  // e.g. ["control", "new-prompt", "aggressive-prompt"]
  variants?: string[];
  // Description for internal tracking
  description: string;
}

// Default flags — loaded when Redis has no flags stored
const DEFAULT_FLAGS: FlagDefinition[] = [
  {
    key: "agent-pipeline",
    enabled: false,
    rolloutPercentage: 0,
    description: "Use multi-step agentic pipeline instead of single-shot outfit generation",
  },
  {
    key: "semantic-search",
    enabled: false,
    rolloutPercentage: 0,
    description: "Use RAG embedding search instead of SQL keyword search for catalog",
  },
  {
    key: "outfit-prompt-v2",
    enabled: false,
    rolloutPercentage: 0,
    variants: ["control", "detailed", "concise"],
    description: "A/B test different outfit generation prompt styles",
  },
  {
    key: "stylist-personality",
    enabled: false,
    rolloutPercentage: 0,
    variants: ["friendly", "sassy", "professional"],
    description: "A/B test different stylist chat personalities",
  },
];

const REDIS_KEY = "feature-flags";

// Deterministic hash — same userId always gets the same bucket (0-99)
// Uses FNV-1a hash for fast, even distribution
function hashUserToBucket(userId: string, flagKey: string): number {
  const input = `${userId}:${flagKey}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash % 100;
}

// Get all flag definitions from Redis (or defaults)
export async function getAllFlags(): Promise<FlagDefinition[]> {
  try {
    const stored = await redis.get<FlagDefinition[]>(REDIS_KEY);
    return stored || DEFAULT_FLAGS;
  } catch {
    return DEFAULT_FLAGS;
  }
}

// Check if a feature flag is enabled for a specific user
export async function isEnabled(flagKey: string, userId: string): Promise<boolean> {
  const flags = await getAllFlags();
  const flag = flags.find((f) => f.key === flagKey);

  if (!flag || !flag.enabled) return false;

  // Percentage rollout — deterministic per user
  const bucket = hashUserToBucket(userId, flagKey);
  return bucket < flag.rolloutPercentage;
}

// Get which variant a user is assigned to in an A/B test
// Returns null if the flag isn't active for this user
export async function getVariant(flagKey: string, userId: string): Promise<string | null> {
  const flags = await getAllFlags();
  const flag = flags.find((f) => f.key === flagKey);

  if (!flag || !flag.enabled || !flag.variants?.length) return null;

  // Check rollout first
  const bucket = hashUserToBucket(userId, flagKey);
  if (bucket >= flag.rolloutPercentage) return null;

  // Assign variant deterministically
  const variantIndex = hashUserToBucket(userId, `${flagKey}:variant`) % flag.variants.length;
  return flag.variants[variantIndex];
}

// Update a flag definition (admin use)
export async function updateFlag(
  flagKey: string,
  updates: Partial<Pick<FlagDefinition, "enabled" | "rolloutPercentage" | "variants">>
): Promise<void> {
  const flags = await getAllFlags();
  const index = flags.findIndex((f) => f.key === flagKey);

  if (index === -1) return;

  flags[index] = { ...flags[index], ...updates };
  await redis.set(REDIS_KEY, flags);
}

// Track which variant a user saw (for analytics)
// Stores in Redis sorted set — key per flag, member is variant, score is count
export async function trackExposure(flagKey: string, variant: string): Promise<void> {
  try {
    await redis.zincrby(`flag-exposure:${flagKey}`, 1, variant);
  } catch {
    // Analytics tracking is non-fatal
  }
}

// Get exposure counts for a flag (admin analytics)
export async function getExposureCounts(flagKey: string): Promise<Record<string, number>> {
  try {
    const results = await redis.zrange(`flag-exposure:${flagKey}`, 0, -1, { withScores: true });
    const counts: Record<string, number> = {};
    for (let i = 0; i < results.length; i += 2) {
      counts[results[i] as string] = results[i + 1] as number;
    }
    return counts;
  } catch {
    return {};
  }
}
