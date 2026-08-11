// ── Observability Layer ──
// Structured logging + performance tracing for AI calls
// Tracks: latency, token usage, error rates, fallback triggers
// Outputs structured JSON logs that work with Vercel Log Drains, Sentry, or Datadog

// Log levels for filtering
type LogLevel = "info" | "warn" | "error" | "debug";

// Structured log entry — every AI operation gets one
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  durationMs?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

// Emit a structured log — JSON to stdout, picked up by Vercel Log Drains
function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// ── AI Call Tracer ──
// Wraps any async function with timing, error tracking, and structured logging
export async function traceAiCall<T>(
  operation: string,
  userId: string | undefined,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - start;

    emit({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "ai",
      operation,
      durationMs,
      userId,
      metadata: {
        ...metadata,
        success: true,
      },
    });

    // Track slow calls — anything over 5s is worth investigating
    if (durationMs > 5000) {
      emit({
        timestamp: new Date().toISOString(),
        level: "warn",
        service: "ai",
        operation,
        durationMs,
        userId,
        metadata: { ...metadata, slowCall: true },
      });
    }

    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);

    emit({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "ai",
      operation,
      durationMs,
      userId,
      error: errorMsg,
      metadata: {
        ...metadata,
        success: false,
        errorType: error instanceof Error ? error.constructor.name : "unknown",
      },
    });

    throw error;
  }
}

// ── Metrics Tracker ──
// In-memory counters flushed to Redis periodically
// Tracks: total calls, errors, latency percentiles per operation
const metrics: Map<string, { count: number; errors: number; totalMs: number; maxMs: number }> = new Map();

export function recordMetric(operation: string, durationMs: number, isError: boolean) {
  const existing = metrics.get(operation) || { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
  existing.count++;
  if (isError) existing.errors++;
  existing.totalMs += durationMs;
  existing.maxMs = Math.max(existing.maxMs, durationMs);
  metrics.set(operation, existing);
}

// Get current metrics snapshot (for /api/health or admin dashboard)
export function getMetricsSnapshot(): Record<string, {
  count: number;
  errors: number;
  errorRate: string;
  avgMs: number;
  maxMs: number;
}> {
  const snapshot: Record<string, { count: number; errors: number; errorRate: string; avgMs: number; maxMs: number }> = {};

  for (const [op, m] of metrics) {
    snapshot[op] = {
      count: m.count,
      errors: m.errors,
      errorRate: m.count > 0 ? `${((m.errors / m.count) * 100).toFixed(1)}%` : "0%",
      avgMs: m.count > 0 ? Math.round(m.totalMs / m.count) : 0,
      maxMs: m.maxMs,
    };
  }

  return snapshot;
}

// Reset metrics (call after flushing to persistent storage)
export function resetMetrics() {
  metrics.clear();
}

// ── Fallback Tracker ──
// Tracks how often each fallback tier is used
// Useful for knowing if your AI provider is degraded
export function trackFallback(tier: "ai" | "cached" | "editors-pick", operation: string) {
  emit({
    timestamp: new Date().toISOString(),
    level: tier === "ai" ? "info" : "warn",
    service: "fallback",
    operation,
    metadata: { tier },
  });
  recordMetric(`fallback:${tier}`, 0, tier === "editors-pick");
}

// ── Health Check Data ──
// Returns structured health info for /api/health endpoint
export function getHealthData() {
  return {
    status: "ok",
    metrics: getMetricsSnapshot(),
    uptime: process.uptime(),
  };
}
