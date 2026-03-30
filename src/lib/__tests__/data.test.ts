import { describe, it, expect } from "vitest";
import { calculateBusinessStats } from "../data";

describe("calculateBusinessStats", () => {
  it("returns zeros for empty reviews", () => {
    expect(calculateBusinessStats([])).toEqual({
      total_reviews: 0,
      pending_replies: 0,
      replied_count: 0,
      average_rating: 0,
    });
  });

  it("counts total reviews", () => {
    const reviews = [
      { rating: 5, status: "pending" },
      { rating: 3, status: "pending" },
      { rating: 1, status: "auto_replied" },
    ];
    const stats = calculateBusinessStats(reviews);
    expect(stats.total_reviews).toBe(3);
  });

  it("counts pending reviews", () => {
    const reviews = [
      { rating: 5, status: "pending" },
      { rating: 4, status: "pending" },
      { rating: 3, status: "auto_replied" },
    ];
    expect(calculateBusinessStats(reviews).pending_replies).toBe(2);
  });

  it("counts replied reviews (auto + manual)", () => {
    const reviews = [
      { rating: 5, status: "auto_replied" },
      { rating: 4, status: "manually_replied" },
      { rating: 3, status: "pending" },
      { rating: 2, status: "skipped" },
    ];
    expect(calculateBusinessStats(reviews).replied_count).toBe(2);
  });

  it("calculates average rating rounded to 1 decimal", () => {
    const reviews = [
      { rating: 5, status: "pending" },
      { rating: 4, status: "pending" },
      { rating: 3, status: "pending" },
    ];
    // (5+4+3)/3 = 4.0
    expect(calculateBusinessStats(reviews).average_rating).toBe(4);
  });

  it("rounds average rating correctly", () => {
    const reviews = [
      { rating: 5, status: "pending" },
      { rating: 5, status: "pending" },
      { rating: 4, status: "pending" },
    ];
    // (5+5+4)/3 = 4.666... → 4.7
    expect(calculateBusinessStats(reviews).average_rating).toBe(4.7);
  });
});
