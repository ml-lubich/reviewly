import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifySentiment, buildReplyPrompt, generateReviewReply } from "../openai";

// Mock env module
vi.mock("../env", () => ({
  getOpenAIApiKey: () => "test-api-key",
}));

// Mock OpenAI client
const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

describe("classifySentiment", () => {
  it("returns positive for rating 5", () => {
    expect(classifySentiment(5)).toBe("positive");
  });

  it("returns positive for rating 4", () => {
    expect(classifySentiment(4)).toBe("positive");
  });

  it("returns neutral for rating 3", () => {
    expect(classifySentiment(3)).toBe("neutral");
  });

  it("returns negative for rating 2", () => {
    expect(classifySentiment(2)).toBe("negative");
  });

  it("returns negative for rating 1", () => {
    expect(classifySentiment(1)).toBe("negative");
  });
});

describe("buildReplyPrompt", () => {
  const baseBusiness = {
    tone_description: "friendly and professional",
    example_responses: [],
    negative_review_strategy: "apologize_resolve",
  };

  const baseReview = {
    review_text: "Great service!",
    reviewer_name: "Alice",
    rating: 5,
  };

  it("includes business tone description", () => {
    const prompt = buildReplyPrompt(baseReview, baseBusiness);
    expect(prompt).toContain("friendly and professional");
  });

  it("includes reviewer name and rating", () => {
    const prompt = buildReplyPrompt(baseReview, baseBusiness);
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("5/5 stars (positive)");
  });

  it("includes review text", () => {
    const prompt = buildReplyPrompt(baseReview, baseBusiness);
    expect(prompt).toContain("Great service!");
  });

  it("handles null review text", () => {
    const review = { ...baseReview, review_text: null };
    const prompt = buildReplyPrompt(review, baseBusiness);
    expect(prompt).toContain("(no text)");
  });

  it("includes example responses when provided", () => {
    const business = {
      ...baseBusiness,
      example_responses: ["Thanks for visiting!", "We appreciate your feedback!"],
    };
    const prompt = buildReplyPrompt(baseReview, business);
    expect(prompt).toContain('1. "Thanks for visiting!"');
    expect(prompt).toContain('2. "We appreciate your feedback!"');
  });

  it("omits examples section when no examples", () => {
    const prompt = buildReplyPrompt(baseReview, baseBusiness);
    expect(prompt).not.toContain("Example responses");
  });

  it("includes negative strategy instruction for low ratings", () => {
    const review = { ...baseReview, rating: 1 };
    const prompt = buildReplyPrompt(review, baseBusiness);
    expect(prompt).toContain("Negative review strategy:");
    expect(prompt).toContain("Apologize sincerely");
  });

  it("uses acknowledge_redirect strategy when configured", () => {
    const review = { ...baseReview, rating: 2 };
    const business = { ...baseBusiness, negative_review_strategy: "acknowledge_redirect" };
    const prompt = buildReplyPrompt(review, business);
    expect(prompt).toContain("redirect to a private channel");
  });

  it("falls back to apologize_resolve for unknown strategy", () => {
    const review = { ...baseReview, rating: 1 };
    const business = { ...baseBusiness, negative_review_strategy: "unknown_strategy" };
    const prompt = buildReplyPrompt(review, business);
    expect(prompt).toContain("Apologize sincerely");
  });

  it("does not include negative strategy for positive reviews", () => {
    const prompt = buildReplyPrompt(baseReview, baseBusiness);
    expect(prompt).not.toContain("Negative review strategy:");
  });

  it("does not include negative strategy for neutral reviews", () => {
    const review = { ...baseReview, rating: 3 };
    const prompt = buildReplyPrompt(review, baseBusiness);
    expect(prompt).not.toContain("Negative review strategy:");
  });
});

describe("generateReviewReply", () => {
  const review = { review_text: "Great!", reviewer_name: "Bob", rating: 5 };
  const business = {
    tone_description: "warm",
    example_responses: [],
    negative_review_strategy: "apologize_resolve",
  };

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns the generated reply text", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Thank you, Bob!" } }],
    });
    const reply = await generateReviewReply(review, business);
    expect(reply).toBe("Thank you, Bob!");
  });

  it("trims whitespace from reply", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "  Thank you!  " } }],
    });
    const reply = await generateReviewReply(review, business);
    expect(reply).toBe("Thank you!");
  });

  it("throws on empty response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    });
    await expect(generateReviewReply(review, business)).rejects.toThrow(
      "Failed to generate reply — empty AI response"
    );
  });

  it("throws on null content", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });
    await expect(generateReviewReply(review, business)).rejects.toThrow(
      "Failed to generate reply — empty AI response"
    );
  });

  it("throws on empty choices", async () => {
    mockCreate.mockResolvedValue({ choices: [] });
    await expect(generateReviewReply(review, business)).rejects.toThrow(
      "Failed to generate reply — empty AI response"
    );
  });

  it("passes correct model and parameters to OpenAI", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Thanks!" } }],
    });
    await generateReviewReply(review, business);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 300,
      })
    );
  });

  it("propagates OpenAI API errors", async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit exceeded"));
    await expect(generateReviewReply(review, business)).rejects.toThrow(
      "API rate limit exceeded"
    );
  });
});
