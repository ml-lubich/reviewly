import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockGenerateReviewReply = vi.fn();
const mockPostReplyToGoogle = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
}));

vi.mock("@/lib/openai", () => ({
  generateReviewReply: (...args: unknown[]) => mockGenerateReviewReply(...args),
}));

vi.mock("@/lib/google-business", () => ({
  postReplyToGoogle: (...args: unknown[]) => mockPostReplyToGoogle(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

import { POST } from "./route";

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/reviews/bulk-reply", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function setupSupabaseChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data, error }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

const TEST_USER = { id: "user-1" };
const TEST_BUSINESS = {
  id: "biz-1",
  owner_id: "user-1",
  tone_description: "friendly",
  example_responses: [],
  negative_review_strategy: "apologize_resolve",
  google_access_token: null,
};

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: "review-1",
    business_id: "biz-1",
    google_review_id: null,
    reviewer_name: "Alice",
    rating: 5,
    review_text: "Great!",
    status: "pending",
    business: TEST_BUSINESS,
    reply: [],
    ...overrides,
  };
}

describe("POST /api/reviews/bulk-reply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } });
    mockCheckRateLimit.mockReturnValue(null);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(createRequest({ reviewIds: ["r1"], action: "generate" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty reviewIds", async () => {
    const res = await POST(createRequest({ reviewIds: [], action: "generate" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("non-empty array");
  });

  it("returns 400 for missing reviewIds", async () => {
    const res = await POST(createRequest({ action: "generate" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid action", async () => {
    setupSupabaseChain([makeReview()]);
    const res = await POST(createRequest({ reviewIds: ["r1"], action: "invalid" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("generate");
  });

  it("returns 400 when reviewIds exceeds max", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `r-${i}`);
    const res = await POST(createRequest({ reviewIds: ids, action: "generate" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Maximum");
  });

  it("returns 404 when no reviews found", async () => {
    setupSupabaseChain([]);
    const res = await POST(createRequest({ reviewIds: ["r1"], action: "generate" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user does not own reviews", async () => {
    const review = makeReview({
      business: { ...TEST_BUSINESS, owner_id: "other-user" },
    });
    setupSupabaseChain([review]);
    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "generate" }));
    expect(res.status).toBe(403);
  });

  it("generates replies for pending reviews", async () => {
    const review = makeReview();
    const chain = setupSupabaseChain([review]);
    chain.single.mockResolvedValue({ data: null, error: null });
    mockGenerateReviewReply.mockResolvedValue("Thank you, Alice!");

    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "generate" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(0);
    expect(mockGenerateReviewReply).toHaveBeenCalledOnce();
  });

  it("skips non-pending reviews during generate", async () => {
    const review = makeReview({ status: "auto_replied" });
    setupSupabaseChain([review]);

    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "generate" }));
    const body = await res.json();

    expect(body.succeeded).toBe(0);
    expect(body.failed).toBe(1);
    expect(body.results[0].error).toContain("not pending");
  });

  it("publishes draft replies", async () => {
    const review = makeReview({
      status: "pending",
      reply: [{ id: "reply-1", final_text: "Thanks!", status: "draft" }],
    });
    const chain = setupSupabaseChain([review]);
    chain.eq.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);

    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "publish" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.succeeded).toBe(1);
  });

  it("skips reviews without drafts during publish", async () => {
    const review = makeReview({ reply: [] });
    setupSupabaseChain([review]);

    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "publish" }));
    const body = await res.json();

    expect(body.succeeded).toBe(0);
    expect(body.failed).toBe(1);
    expect(body.results[0].error).toContain("No draft reply");
  });

  it("skips already published replies", async () => {
    const review = makeReview({
      reply: [{ id: "reply-1", final_text: "Thanks!", status: "published" }],
    });
    setupSupabaseChain([review]);

    const res = await POST(createRequest({ reviewIds: ["review-1"], action: "publish" }));
    const body = await res.json();

    expect(body.failed).toBe(1);
    expect(body.results[0].error).toContain("already published");
  });

  it("handles partial failures in bulk generate", async () => {
    const review1 = makeReview({ id: "r1" });
    const review2 = makeReview({ id: "r2" });
    const chain = setupSupabaseChain([review1, review2]);
    chain.single.mockResolvedValue({ data: null, error: null });

    mockGenerateReviewReply
      .mockResolvedValueOnce("Reply 1")
      .mockRejectedValueOnce(new Error("AI overloaded"));

    const res = await POST(createRequest({ reviewIds: ["r1", "r2"], action: "generate" }));
    const body = await res.json();

    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.results[1].error).toBe("AI overloaded");
  });
});
