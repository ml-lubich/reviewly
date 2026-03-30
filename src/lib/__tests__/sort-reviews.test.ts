import { describe, it, expect } from "vitest";
import { sortReviews } from "../data";
import {
  SORT_NEWEST,
  SORT_OLDEST,
  SORT_HIGHEST_RATED,
  SORT_LOWEST_RATED,
} from "../constants";

const reviews = [
  { rating: 5, review_date: "2024-03-15T10:00:00Z" },
  { rating: 2, review_date: "2024-03-10T10:00:00Z" },
  { rating: 4, review_date: "2024-03-20T10:00:00Z" },
  { rating: 1, review_date: "2024-03-01T10:00:00Z" },
  { rating: 3, review_date: "2024-03-25T10:00:00Z" },
];

describe("sortReviews", () => {
  it("sorts newest first by default", () => {
    const sorted = sortReviews(reviews, SORT_NEWEST);
    const dates = sorted.map((r) => r.review_date);
    expect(dates).toEqual([
      "2024-03-25T10:00:00Z",
      "2024-03-20T10:00:00Z",
      "2024-03-15T10:00:00Z",
      "2024-03-10T10:00:00Z",
      "2024-03-01T10:00:00Z",
    ]);
  });

  it("sorts oldest first", () => {
    const sorted = sortReviews(reviews, SORT_OLDEST);
    const dates = sorted.map((r) => r.review_date);
    expect(dates).toEqual([
      "2024-03-01T10:00:00Z",
      "2024-03-10T10:00:00Z",
      "2024-03-15T10:00:00Z",
      "2024-03-20T10:00:00Z",
      "2024-03-25T10:00:00Z",
    ]);
  });

  it("sorts highest rated first", () => {
    const sorted = sortReviews(reviews, SORT_HIGHEST_RATED);
    const ratings = sorted.map((r) => r.rating);
    expect(ratings).toEqual([5, 4, 3, 2, 1]);
  });

  it("sorts lowest rated first", () => {
    const sorted = sortReviews(reviews, SORT_LOWEST_RATED);
    const ratings = sorted.map((r) => r.rating);
    expect(ratings).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const original = [...reviews];
    sortReviews(reviews, SORT_OLDEST);
    expect(reviews).toEqual(original);
  });

  it("returns empty array for empty input", () => {
    expect(sortReviews([], SORT_NEWEST)).toEqual([]);
  });

  it("handles single element array", () => {
    const single = [{ rating: 3, review_date: "2024-03-15T10:00:00Z" }];
    expect(sortReviews(single, SORT_NEWEST)).toEqual(single);
  });
});
