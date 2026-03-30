import { describe, it, expect, vi } from "vitest";
import { canAddBusiness, canUseAutoReply, getUserTier } from "../subscription";
import type { SubscriptionTier } from "../types";

// Mock stripe module to avoid env var access
vi.mock("../stripe", () => ({
  TIER_LIMITS: {
    free: { businesses: 1, autoReply: false },
    starter: { businesses: 1, autoReply: false },
    professional: { businesses: 5, autoReply: true },
    enterprise: { businesses: Infinity, autoReply: true },
  },
}));

describe("canAddBusiness", () => {
  it("allows free tier with 0 businesses", () => {
    expect(canAddBusiness("free", 0)).toBe(true);
  });

  it("blocks free tier at limit", () => {
    expect(canAddBusiness("free", 1)).toBe(false);
  });

  it("allows professional tier with fewer than 5", () => {
    expect(canAddBusiness("professional", 4)).toBe(true);
  });

  it("blocks professional tier at 5", () => {
    expect(canAddBusiness("professional", 5)).toBe(false);
  });

  it("always allows enterprise tier", () => {
    expect(canAddBusiness("enterprise", 100)).toBe(true);
  });
});

describe("canUseAutoReply", () => {
  it("returns false for free tier", () => {
    expect(canUseAutoReply("free")).toBe(false);
  });

  it("returns false for starter tier", () => {
    expect(canUseAutoReply("starter")).toBe(false);
  });

  it("returns true for professional tier", () => {
    expect(canUseAutoReply("professional")).toBe(true);
  });

  it("returns true for enterprise tier", () => {
    expect(canUseAutoReply("enterprise")).toBe(true);
  });
});

describe("getUserTier", () => {
  function mockSupabase(data: unknown, error?: unknown) {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data, error: error || null }),
          }),
        }),
      }),
    } as any;
  }

  it("returns free when no subscription exists", async () => {
    const tier = await getUserTier(mockSupabase(null), "user-1");
    expect(tier).toBe("free");
  });

  it("returns free when subscription is not active", async () => {
    const tier = await getUserTier(
      mockSupabase({ tier: "professional", status: "canceled" }),
      "user-1"
    );
    expect(tier).toBe("free");
  });

  it("returns the tier when subscription is active", async () => {
    const tier = await getUserTier(
      mockSupabase({ tier: "professional", status: "active" }),
      "user-1"
    );
    expect(tier).toBe("professional");
  });
});
