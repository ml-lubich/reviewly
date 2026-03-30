import { NextResponse } from "next/server";

// Rate limit configuration
const WINDOW_CLEANUP_INTERVAL_MS = 60_000;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamps: number[];
}

const requestStore = new Map<string, RequestRecord>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupExpiredEntries();
  }, WINDOW_CLEANUP_INTERVAL_MS);
  // Allow Node to exit even if timer is active
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, record] of requestStore) {
    record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_CLEANUP_INTERVAL_MS * 2);
    if (record.timestamps.length === 0) {
      requestStore.delete(key);
    }
  }
}

export function resetStore(): void {
  requestStore.clear();
}

function isRateLimited(
  identifier: string,
  config: RateLimitConfig,
  now: number = Date.now()
): { limited: boolean; retryAfterMs: number } {
  startCleanupTimer();

  const record = requestStore.get(identifier) || { timestamps: [] };

  // Remove timestamps outside the current window
  const windowStart = now - config.windowMs;
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestInWindow = record.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return { limited: true, retryAfterMs: Math.max(retryAfterMs, 1) };
  }

  record.timestamps.push(now);
  requestStore.set(identifier, record);
  return { limited: false, retryAfterMs: 0 };
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  const { limited, retryAfterMs } = isRateLimited(identifier, config);

  if (limited) {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  return null;
}

// Exported for testing
export { isRateLimited, requestStore };
