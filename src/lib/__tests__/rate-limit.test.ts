import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  isRateLimited,
  resetStore,
  cleanupExpiredEntries,
  requestStore,
  RateLimitConfig,
} from "../rate-limit";

const TEST_CONFIG: RateLimitConfig = { maxRequests: 3, windowMs: 10_000 };

describe("rate-limit", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("isRateLimited", () => {
    it("allows requests under the limit", () => {
      const result = isRateLimited("user-1", TEST_CONFIG);
      expect(result.limited).toBe(false);
    });

    it("allows exactly maxRequests", () => {
      const now = Date.now();
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        const result = isRateLimited("user-2", TEST_CONFIG, now + i);
        expect(result.limited).toBe(false);
      }
    });

    it("blocks requests over the limit", () => {
      const now = Date.now();
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        isRateLimited("user-3", TEST_CONFIG, now);
      }
      const result = isRateLimited("user-3", TEST_CONFIG, now + 1);
      expect(result.limited).toBe(true);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("allows requests after the window expires", () => {
      const now = Date.now();
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        isRateLimited("user-4", TEST_CONFIG, now);
      }

      // After window expires, should be allowed again
      const afterWindow = now + TEST_CONFIG.windowMs + 1;
      const result = isRateLimited("user-4", TEST_CONFIG, afterWindow);
      expect(result.limited).toBe(false);
    });

    it("uses sliding window - oldest request falls off", () => {
      const now = Date.now();
      // Make 3 requests at t=0, t=3000, t=6000
      isRateLimited("user-5", TEST_CONFIG, now);
      isRateLimited("user-5", TEST_CONFIG, now + 3000);
      isRateLimited("user-5", TEST_CONFIG, now + 6000);

      // At t=7000, still limited (all 3 in window)
      const result1 = isRateLimited("user-5", TEST_CONFIG, now + 7000);
      expect(result1.limited).toBe(true);

      // At t=10001, the first request (t=0) has expired, so one slot opens
      const result2 = isRateLimited("user-5", TEST_CONFIG, now + 10_001);
      expect(result2.limited).toBe(false);
    });

    it("tracks different identifiers independently", () => {
      const now = Date.now();
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        isRateLimited("user-A", TEST_CONFIG, now);
      }

      // user-A is limited
      expect(isRateLimited("user-A", TEST_CONFIG, now).limited).toBe(true);

      // user-B is not limited
      expect(isRateLimited("user-B", TEST_CONFIG, now).limited).toBe(false);
    });

    it("returns correct retryAfterMs", () => {
      const now = 1000000;
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        isRateLimited("user-retry", TEST_CONFIG, now);
      }
      const result = isRateLimited("user-retry", TEST_CONFIG, now + 2000);
      expect(result.limited).toBe(true);
      // Oldest is at `now`, window is 10_000, so retry after = now + 10_000 - (now + 2000) = 8000
      expect(result.retryAfterMs).toBe(8000);
    });
  });

  describe("checkRateLimit", () => {
    it("returns null when not limited", () => {
      const response = checkRateLimit("ok-user", TEST_CONFIG);
      expect(response).toBeNull();
    });

    it("returns 429 response when limited", async () => {
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        checkRateLimit("limited-user", TEST_CONFIG);
      }

      const response = checkRateLimit("limited-user", TEST_CONFIG);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);

      const body = await response!.json();
      expect(body.error).toContain("Too many requests");
    });

    it("includes Retry-After header in 429 response", () => {
      for (let i = 0; i < TEST_CONFIG.maxRequests; i++) {
        checkRateLimit("header-user", TEST_CONFIG);
      }

      const response = checkRateLimit("header-user", TEST_CONFIG);
      expect(response).not.toBeNull();
      const retryAfter = response!.headers.get("Retry-After");
      expect(retryAfter).toBeTruthy();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });
  });

  describe("cleanupExpiredEntries", () => {
    it("removes entries with no recent timestamps", () => {
      // Manually insert an old entry
      requestStore.set("old-user", { timestamps: [Date.now() - 200_000] });
      requestStore.set("new-user", { timestamps: [Date.now()] });

      cleanupExpiredEntries();

      expect(requestStore.has("old-user")).toBe(false);
      expect(requestStore.has("new-user")).toBe(true);
    });
  });

  describe("resetStore", () => {
    it("clears all entries", () => {
      isRateLimited("some-user", TEST_CONFIG);
      expect(requestStore.size).toBeGreaterThan(0);

      resetStore();
      expect(requestStore.size).toBe(0);
    });
  });
});
