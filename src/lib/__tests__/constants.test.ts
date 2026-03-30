import { describe, it, expect } from "vitest";
import {
  REVIEW_STATUS_PENDING,
  REVIEW_STATUS_AUTO_REPLIED,
  REVIEW_STATUS_MANUALLY_REPLIED,
  REVIEW_STATUS_SKIPPED,
  REPLY_STATUS_DRAFT,
  REPLY_STATUS_APPROVED,
  REPLY_STATUS_PUBLISHED,
  POSITIVE_RATING_THRESHOLD,
  NEUTRAL_RATING,
  AI_MODEL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS_REPLY,
  AI_MAX_TOKENS_AUTO_REPLY,
  GOOGLE_TOKEN_REFRESH_BUFFER_MS,
  GOOGLE_REVIEWS_PAGE_SIZE,
  STRATEGY_APOLOGIZE_RESOLVE,
  STRATEGY_ACKNOWLEDGE_REDIRECT,
  STRATEGY_FLAG_MANUAL,
  NEGATIVE_STRATEGY_INSTRUCTIONS,
  FREE_TIER_BUSINESSES,
  STARTER_TIER_BUSINESSES,
  PROFESSIONAL_TIER_BUSINESSES,
  ENTERPRISE_TIER_BUSINESSES,
  AUTO_REPLY_BATCH_LIMIT,
} from "../constants";

describe("constants", () => {
  describe("review statuses", () => {
    it("has correct values", () => {
      expect(REVIEW_STATUS_PENDING).toBe("pending");
      expect(REVIEW_STATUS_AUTO_REPLIED).toBe("auto_replied");
      expect(REVIEW_STATUS_MANUALLY_REPLIED).toBe("manually_replied");
      expect(REVIEW_STATUS_SKIPPED).toBe("skipped");
    });
  });

  describe("reply statuses", () => {
    it("has correct values", () => {
      expect(REPLY_STATUS_DRAFT).toBe("draft");
      expect(REPLY_STATUS_APPROVED).toBe("approved");
      expect(REPLY_STATUS_PUBLISHED).toBe("published");
    });
  });

  describe("rating thresholds", () => {
    it("positive threshold is 4", () => {
      expect(POSITIVE_RATING_THRESHOLD).toBe(4);
    });

    it("neutral rating is 3", () => {
      expect(NEUTRAL_RATING).toBe(3);
    });
  });

  describe("AI config", () => {
    it("uses gpt-4o", () => {
      expect(AI_MODEL).toBe("gpt-4o");
    });

    it("has valid temperature and token limits", () => {
      expect(AI_TEMPERATURE).toBeGreaterThan(0);
      expect(AI_TEMPERATURE).toBeLessThanOrEqual(1);
      expect(AI_MAX_TOKENS_REPLY).toBeGreaterThan(AI_MAX_TOKENS_AUTO_REPLY);
    });
  });

  describe("Google API config", () => {
    it("token refresh buffer is 5 minutes", () => {
      expect(GOOGLE_TOKEN_REFRESH_BUFFER_MS).toBe(300000);
    });

    it("page size is 50", () => {
      expect(GOOGLE_REVIEWS_PAGE_SIZE).toBe("50");
    });
  });

  describe("negative review strategies", () => {
    it("all strategies have instructions", () => {
      expect(NEGATIVE_STRATEGY_INSTRUCTIONS[STRATEGY_APOLOGIZE_RESOLVE]).toBeDefined();
      expect(NEGATIVE_STRATEGY_INSTRUCTIONS[STRATEGY_ACKNOWLEDGE_REDIRECT]).toBeDefined();
      expect(NEGATIVE_STRATEGY_INSTRUCTIONS[STRATEGY_FLAG_MANUAL]).toBeDefined();
    });
  });

  describe("tier business limits", () => {
    it("free and starter allow 1 business", () => {
      expect(FREE_TIER_BUSINESSES).toBe(1);
      expect(STARTER_TIER_BUSINESSES).toBe(1);
    });

    it("professional allows 5", () => {
      expect(PROFESSIONAL_TIER_BUSINESSES).toBe(5);
    });

    it("enterprise is unlimited", () => {
      expect(ENTERPRISE_TIER_BUSINESSES).toBe(Infinity);
    });
  });

  it("auto reply batch limit is defined", () => {
    expect(AUTO_REPLY_BATCH_LIMIT).toBe(10);
  });
});
