import OpenAI from "openai";
import { getOpenAIApiKey } from "./env";
import {
  AI_MODEL,
  AI_TEMPERATURE,
  AI_MAX_TOKENS_REPLY,
  POSITIVE_RATING_THRESHOLD,
  NEUTRAL_RATING,
  NEGATIVE_STRATEGY_INSTRUCTIONS,
  STRATEGY_APOLOGIZE_RESOLVE,
} from "./constants";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: getOpenAIApiKey() });
  }
  return openaiClient;
}

function classifySentiment(rating: number): "positive" | "neutral" | "negative" {
  if (rating >= POSITIVE_RATING_THRESHOLD) return "positive";
  if (rating === NEUTRAL_RATING) return "neutral";
  return "negative";
}

function buildReplyPrompt(
  review: { review_text: string | null; reviewer_name: string; rating: number },
  business: { tone_description: string; example_responses: string[]; negative_review_strategy: string }
): string {
  const sentiment = classifySentiment(review.rating);

  const examplesSection = business.example_responses?.length
    ? `\n\nExample responses from this business:\n${business.example_responses.map((r: string, i: number) => `${i + 1}. "${r}"`).join("\n")}`
    : "";

  const strategyInstruction = sentiment === "negative"
    ? `\nNegative review strategy: ${NEGATIVE_STRATEGY_INSTRUCTIONS[business.negative_review_strategy] || NEGATIVE_STRATEGY_INSTRUCTIONS[STRATEGY_APOLOGIZE_RESOLVE]}`
    : "";

  return `You are a review response assistant. Generate a professional, genuine reply to this Google review.

Business tone/voice: ${business.tone_description}${examplesSection}${strategyInstruction}

Review:
- Reviewer: ${review.reviewer_name}
- Rating: ${review.rating}/5 stars (${sentiment})
- Text: "${review.review_text || "(no text)"}"

Guidelines:
- Match the business's tone exactly
- For positive (4-5 stars): Express gratitude, reference specifics, invite them back
- For neutral (3 stars): Thank them, acknowledge feedback, mention improvements
- For negative (1-2 stars): Follow the negative review strategy above
- 2-4 sentences, address reviewer by name, sound human

Generate ONLY the reply text.`;
}

export async function generateReviewReply(
  review: { review_text: string | null; reviewer_name: string; rating: number },
  business: { tone_description: string; example_responses: string[]; negative_review_strategy: string }
): Promise<string> {
  const openai = getOpenAIClient();
  const prompt = buildReplyPrompt(review, business);

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: AI_TEMPERATURE,
    max_tokens: AI_MAX_TOKENS_REPLY,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("Failed to generate reply — empty AI response");
  return reply;
}
