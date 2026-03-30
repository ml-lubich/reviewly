import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGoogleReviews, postReplyToGoogle } from "../google-business";
import type { Business } from "../types";

// Mock google-oauth
vi.mock("../google-oauth", () => ({
  getValidAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

vi.mock("../env", () => ({
  getGoogleClientId: () => "test-client-id",
  getGoogleClientSecret: () => "test-client-secret",
  getAppUrl: () => "https://app.example.com",
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function createMockSupabase() {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};

  chainable.from = vi.fn().mockReturnThis();
  chainable.select = vi.fn().mockReturnThis();
  chainable.insert = vi.fn().mockReturnThis();
  chainable.update = vi.fn().mockReturnThis();
  chainable.eq = vi.fn().mockReturnThis();
  chainable.single = vi.fn().mockResolvedValue({ data: null, error: null });

  const handler: ProxyHandler<typeof chainable> = {
    get(target, prop: string) {
      // Prevent the proxy from being treated as a thenable (which would hang await)
      if (prop === "then") return undefined;
      if (prop in target) return target[prop];
      target[prop] = vi.fn().mockReturnValue(new Proxy(target, handler));
      return target[prop];
    },
  };

  return new Proxy(chainable, handler) as unknown as ReturnType<
    typeof createMockSupabase
  > &
    Record<string, ReturnType<typeof vi.fn>>;
}

function createBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    owner_id: "user-1",
    google_place_id: "place-1",
    google_account_id: "accounts/123",
    google_location_id: "locations/456",
    business_name: "Test Biz",
    tone_description: "friendly",
    example_responses: [],
    negative_review_strategy: "apologize_resolve",
    auto_reply_enabled: false,
    google_access_token: "access-token",
    google_refresh_token: "refresh-token",
    google_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeGoogleReview(overrides: Record<string, unknown> = {}) {
  return {
    reviewId: "review-1",
    reviewer: { displayName: "Alice", profilePhotoUrl: "https://photo.url" },
    starRating: "FIVE",
    comment: "Great service!",
    createTime: "2026-01-15T10:00:00Z",
    updateTime: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.clearAllMocks();
});

describe("fetchGoogleReviews", () => {
  it("syncs reviews from Google and upserts them", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview()],
        }),
    });

    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: { id: "new-review-id" }, error: null });
    });

    const result = await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(result).toEqual({ synced: 1, errors: 0 });
    expect(supabase.from).toHaveBeenCalledWith("reviews");
  });

  it("throws if business is missing Google account/location IDs", async () => {
    const supabase = createMockSupabase();
    const business = createBusiness({
      google_account_id: null,
      google_location_id: null,
    });

    await expect(
      fetchGoogleReviews(business, supabase as any)
    ).rejects.toThrow("Business missing Google account/location IDs");
  });

  it("handles API errors gracefully", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    await expect(
      fetchGoogleReviews(createBusiness(), supabase as any)
    ).rejects.toThrow("Google Reviews API error: 500 Internal Server Error");
  });

  it("updates existing review instead of inserting", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview()],
        }),
    });

    supabase.single.mockResolvedValue({
      data: { id: "existing-id", status: "pending" },
      error: null,
    });

    const result = await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(result).toEqual({ synced: 1, errors: 0 });
    expect(supabase.update).toHaveBeenCalled();
  });

  it("handles pagination with nextPageToken", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview({ reviewId: "rev-1" })],
          nextPageToken: "page-2-token",
        }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview({ reviewId: "rev-2" })],
        }),
    });

    let insertSingleCount = 0;
    supabase.single.mockImplementation(() => {
      insertSingleCount++;
      if (insertSingleCount % 2 === 1) {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({
        data: { id: `new-${insertSingleCount}` },
        error: null,
      });
    });

    const result = await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(result).toEqual({ synced: 2, errors: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const secondUrl = mockFetch.mock.calls[1][0];
    expect(secondUrl).toContain("pageToken=page-2-token");
  });

  it("handles empty reviews response", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ reviews: undefined }),
    });

    const result = await fetchGoogleReviews(createBusiness(), supabase as any);
    expect(result).toEqual({ synced: 0, errors: 0 });
  });

  it("sets status to auto_replied for reviews with existing reply", async () => {
    const supabase = createMockSupabase();

    const reviewWithReply = makeGoogleReview({
      reviewReply: {
        comment: "Thanks!",
        updateTime: "2026-01-16T10:00:00Z",
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ reviews: [reviewWithReply] }),
    });

    let singleCount = 0;
    supabase.single.mockImplementation(() => {
      singleCount++;
      if (singleCount === 1)
        return Promise.resolve({ data: null, error: null });
      return Promise.resolve({ data: { id: "new-id" }, error: null });
    });

    await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "auto_replied" })
    );

    expect(supabase.from).toHaveBeenCalledWith("replies");
  });

  it("sets status to pending for reviews without reply", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview({ reviewReply: undefined })],
        }),
    });

    let singleCount = 0;
    supabase.single.mockImplementation(() => {
      singleCount++;
      if (singleCount === 1)
        return Promise.resolve({ data: null, error: null });
      return Promise.resolve({ data: { id: "new-id" }, error: null });
    });

    await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );
  });

  it("counts errors when individual review upsert fails", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [
            makeGoogleReview({ reviewId: "rev-ok" }),
            makeGoogleReview({ reviewId: "rev-fail" }),
          ],
        }),
    });

    let callCount = 0;
    supabase.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: null, error: null });
      }
      if (callCount === 2) {
        return Promise.resolve({ data: { id: "ok" }, error: null });
      }
      throw new Error("DB error");
    });

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(result.synced).toBe(1);
    expect(result.errors).toBe(1);
    consoleSpy.mockRestore();
  });

  it("maps star ratings correctly", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          reviews: [makeGoogleReview({ starRating: "THREE" })],
        }),
    });

    let singleCount = 0;
    supabase.single.mockImplementation(() => {
      singleCount++;
      if (singleCount === 1)
        return Promise.resolve({ data: null, error: null });
      return Promise.resolve({ data: { id: "new-id" }, error: null });
    });

    await fetchGoogleReviews(createBusiness(), supabase as any);

    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 3 })
    );
  });
});

describe("fetchWithRateLimitRetry (via fetchGoogleReviews)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries on 429 and succeeds on retry", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "1" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ reviews: [] }),
    });

    const promise = fetchGoogleReviews(createBusiness(), supabase as any);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toEqual({ synced: 0, errors: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries up to MAX_RETRIES (2) times then returns error response", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
      text: () => Promise.resolve("Rate limited"),
    });

    const promise = fetchGoogleReviews(createBusiness(), supabase as any).catch(
      (err: Error) => err
    );

    // Advance past retry delays: 2000ms (retry 0) + 4000ms (retry 1)
    await vi.advanceTimersByTimeAsync(7000);

    const result = await promise;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain(
      "Google Reviews API error: 429 Rate limited"
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("uses Retry-After header for delay when present", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "3" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ reviews: [] }),
    });

    const promise = fetchGoogleReviews(createBusiness(), supabase as any);
    // Retry-After: 3 → 3000ms delay
    await vi.advanceTimersByTimeAsync(3500);
    const result = await promise;

    expect(result).toEqual({ synced: 0, errors: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("postReplyToGoogle", () => {
  it("posts reply successfully", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await postReplyToGoogle(
      createBusiness(),
      "review-123",
      "Thank you!",
      supabase as any
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "accounts/123/locations/456/reviews/review-123/reply"
      ),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-access-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ comment: "Thank you!" }),
      })
    );
  });

  it("throws on API error", async () => {
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve("Forbidden"),
    });

    await expect(
      postReplyToGoogle(
        createBusiness(),
        "review-123",
        "Thanks!",
        supabase as any
      )
    ).rejects.toThrow("Failed to post reply to Google: 403 Forbidden");
  });

  it("retries on rate limit when posting reply", async () => {
    vi.useFakeTimers();
    const supabase = createMockSupabase();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "1" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const promise = postReplyToGoogle(
      createBusiness(),
      "review-123",
      "Thanks!",
      supabase as any
    );
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
