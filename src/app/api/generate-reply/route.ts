import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewText, reviewerName, rating, toneDescription, exampleResponses } = body;

    if (!reviewText || !rating || !toneDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sentiment = rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative";

    const examplesSection = exampleResponses?.length
      ? `\n\nHere are example responses from this business for reference:\n${exampleResponses.map((r: string, i: number) => `${i + 1}. "${r}"`).join("\n")}`
      : "";

    const prompt = `You are a review response assistant for a business. Generate a professional, genuine reply to the following Google review.

Business tone/voice: ${toneDescription}
${examplesSection}

Review details:
- Reviewer: ${reviewerName}
- Rating: ${rating}/5 stars (${sentiment} review)
- Review text: "${reviewText}"

Guidelines:
- Match the business's configured tone exactly
- For positive reviews (4-5 stars): Express genuine gratitude, reference specific things they mentioned, invite them back
- For neutral reviews (3 stars): Thank them, acknowledge their feedback, mention improvements being made
- For negative reviews (1-2 stars): Apologize sincerely, take responsibility, offer to make it right, provide a way to follow up
- Keep the response concise (2-4 sentences)
- Address the reviewer by name
- Never be defensive or dismissive
- Sound human, not robotic

Generate ONLY the reply text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const generatedReply = completion.choices[0]?.message?.content?.trim();

    if (!generatedReply) {
      return NextResponse.json(
        { error: "Failed to generate reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: generatedReply });
  } catch (error) {
    console.error("Error generating reply:", error);

    // Fallback mock response when OpenAI isn't configured
    const body = await request.clone().json().catch(() => ({}));
    const { reviewerName = "Customer", rating = 5 } = body;

    const fallbackReplies: Record<string, string> = {
      positive: `Thank you so much for your wonderful review, ${reviewerName}! We're thrilled to hear about your experience. Your kind words mean the world to our team. We look forward to welcoming you back soon!`,
      neutral: `Thank you for your feedback, ${reviewerName}. We appreciate you taking the time to share your experience. We're always working to improve, and your input helps us do that. We'd love to welcome you back and exceed your expectations next time.`,
      negative: `${reviewerName}, we sincerely apologize for your experience. This is not the standard we hold ourselves to, and we take your feedback very seriously. We'd love the opportunity to make this right — please reach out to us directly so we can resolve this for you.`,
    };

    const sentiment = rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative";
    return NextResponse.json({ reply: fallbackReplies[sentiment] });
  }
}
