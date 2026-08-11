// ── Eval: Feature Flags ──
// Tests the deterministic bucketing and variant assignment logic
// These run WITHOUT Redis — they test the hashing algorithm

import { describe, it, expect } from "vitest";

// Recreate the hash function for testing (same as in flags/index.ts)
function hashUserToBucket(userId: string, flagKey: string): number {
  const input = `${userId}:${flagKey}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash % 100;
}

describe("hashUserToBucket", () => {
  it("returns deterministic results for the same input", () => {
    const bucket1 = hashUserToBucket("user_123", "test-flag");
    const bucket2 = hashUserToBucket("user_123", "test-flag");
    expect(bucket1).toBe(bucket2);
  });

  it("returns different buckets for different users", () => {
    const bucketA = hashUserToBucket("user_aaa", "test-flag");
    const bucketB = hashUserToBucket("user_bbb", "test-flag");
    // Different users should (almost always) get different buckets
    // This could theoretically collide, but with FNV-1a it's extremely unlikely
    expect(bucketA).not.toBe(bucketB);
  });

  it("returns different buckets for different flags", () => {
    const bucket1 = hashUserToBucket("user_123", "flag-a");
    const bucket2 = hashUserToBucket("user_123", "flag-b");
    expect(bucket1).not.toBe(bucket2);
  });

  it("always returns a value between 0 and 99", () => {
    const testUsers = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
    for (const userId of testUsers) {
      const bucket = hashUserToBucket(userId, "test-flag");
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });

  it("distributes across many buckets (no catastrophic clustering)", () => {
    // Use realistic UUIDs instead of sequential numeric IDs
    const buckets = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const userId = `usr_${i.toString(36)}_${(i * 7 + 13).toString(16)}`;
      const bucket = hashUserToBucket(userId, "distribution-test");
      buckets.add(bucket);
    }

    // 500 IDs should spread across many buckets — catches degenerate hashing
    expect(buckets.size).toBeGreaterThan(25);
  });
});

describe("rollout percentage logic", () => {
  it("0% rollout blocks all users", () => {
    const rollout = 0;
    let enabled = 0;
    for (let i = 0; i < 100; i++) {
      const bucket = hashUserToBucket(`user_${i}`, "zero-flag");
      if (bucket < rollout) enabled++;
    }
    expect(enabled).toBe(0);
  });

  it("100% rollout includes all users", () => {
    const rollout = 100;
    let enabled = 0;
    for (let i = 0; i < 100; i++) {
      const bucket = hashUserToBucket(`user_${i}`, "full-flag");
      if (bucket < rollout) enabled++;
    }
    expect(enabled).toBe(100);
  });

  it("50% rollout includes roughly half of users", () => {
    const rollout = 50;
    let enabled = 0;
    const total = 10000;
    for (let i = 0; i < total; i++) {
      const bucket = hashUserToBucket(`user_${i}`, "half-flag");
      if (bucket < rollout) enabled++;
    }
    // Should be roughly 50% — allow 5% deviation
    const percentage = (enabled / total) * 100;
    expect(percentage).toBeGreaterThan(45);
    expect(percentage).toBeLessThan(55);
  });

  it("10% rollout is sticky — same user always in or out", () => {
    const rollout = 10;
    const userId = "sticky-test-user";
    const bucket = hashUserToBucket(userId, "sticky-flag");
    const isEnabled = bucket < rollout;

    // Run 100 times — result should never change
    for (let i = 0; i < 100; i++) {
      const b = hashUserToBucket(userId, "sticky-flag");
      expect(b < rollout).toBe(isEnabled);
    }
  });
});

describe("variant assignment logic", () => {
  it("assigns variants deterministically", () => {
    const variants = ["control", "new-prompt", "aggressive"];
    const userId = "variant-user";
    const flagKey = "prompt-test";

    const variantIndex1 = hashUserToBucket(userId, `${flagKey}:variant`) % variants.length;
    const variantIndex2 = hashUserToBucket(userId, `${flagKey}:variant`) % variants.length;

    expect(variantIndex1).toBe(variantIndex2);
  });

  it("distributes variants roughly evenly", () => {
    const variants = ["a", "b", "c"];
    const counts = { a: 0, b: 0, c: 0 };
    const total = 10000;

    for (let i = 0; i < total; i++) {
      const idx = hashUserToBucket(`user_${i}`, "variant-dist:variant") % variants.length;
      counts[variants[idx] as keyof typeof counts]++;
    }

    // Each variant should have roughly 3333 users
    for (const v of variants) {
      const pct = (counts[v as keyof typeof counts] / total) * 100;
      expect(pct).toBeGreaterThan(25);
      expect(pct).toBeLessThan(42);
    }
  });
});
