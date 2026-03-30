import { describe, it, expect } from "vitest";
import { reviewsToCsv } from "../csv";
import type { Review } from "../types";

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: "r1",
    business_id: "b1",
    google_review_id: null,
    reviewer_name: "Alice",
    reviewer_photo_url: null,
    rating: 5,
    review_text: "Great place!",
    review_date: "2026-01-15",
    status: "pending",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    reply: null,
    ...overrides,
  };
}

const EXPECTED_HEADER =
  "reviewer_name,rating,review_text,review_date,status,reply_text,reply_status,reply_published_at";

describe("reviewsToCsv", () => {
  it("returns only headers for empty array", () => {
    expect(reviewsToCsv([])).toBe(EXPECTED_HEADER);
  });

  it("includes all fields correctly", () => {
    const review = makeReview({
      reply: {
        id: "rep1",
        review_id: "r1",
        generated_text: "Thanks!",
        final_text: "Thank you so much!",
        status: "published",
        published_at: "2026-01-16T10:00:00Z",
        created_at: "2026-01-15T12:00:00Z",
      },
    });
    const csv = reviewsToCsv([review]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      "Alice,5,Great place!,2026-01-15,pending,Thank you so much!,published,2026-01-16T10:00:00Z"
    );
  });

  it("escapes commas in fields", () => {
    const review = makeReview({ review_text: "Good food, great service" });
    const csv = reviewsToCsv([review]);
    expect(csv).toContain('"Good food, great service"');
  });

  it("escapes double quotes in fields", () => {
    const review = makeReview({ review_text: 'Said "amazing"' });
    const csv = reviewsToCsv([review]);
    expect(csv).toContain('"Said ""amazing"""');
  });

  it("escapes newlines in fields", () => {
    const review = makeReview({ review_text: "Line1\nLine2" });
    const csv = reviewsToCsv([review]);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it("handles null and undefined fields gracefully", () => {
    const review = makeReview({ review_text: null, reply: null });
    const csv = reviewsToCsv([review]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("Alice,5,,2026-01-15,pending,,,");
  });

  it("uses generated_text as fallback when final_text is null", () => {
    const review = makeReview({
      reply: {
        id: "rep1",
        review_id: "r1",
        generated_text: "Auto reply",
        final_text: null,
        status: "draft",
        published_at: null,
        created_at: "2026-01-15T12:00:00Z",
      },
    });
    const csv = reviewsToCsv([review]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain("Auto reply,draft,");
  });
});
