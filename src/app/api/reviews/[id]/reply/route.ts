import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { postReplyToGoogle } from "@/lib/google-business";
import OpenAI from "openai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, replyText } = body;
  // action: "generate" | "save" | "publish"

  // Fetch review with business info
  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .select("*, business:businesses(*)")
    .eq("id", reviewId)
    .single();

  if (reviewErr || !review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const business = Array.isArray(review.business) ? review.business[0] : review.business;

  if (!business || business.owner_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    if (action === "generate") {
      // Generate AI reply
      const generatedText = await generateAIReply(review, business);

      // Create or update reply record
      const { data: existingReply } = await supabase
        .from("replies")
        .select("id")
        .eq("review_id", reviewId)
        .single();

      let reply;
      if (existingReply) {
        const { data } = await supabase
          .from("replies")
          .update({ generated_text: generatedText, final_text: generatedText, status: "draft" })
          .eq("id", existingReply.id)
          .select()
          .single();
        reply = data;
      } else {
        const { data } = await supabase
          .from("replies")
          .insert({
            review_id: reviewId,
            generated_text: generatedText,
            final_text: generatedText,
            status: "draft",
          })
          .select()
          .single();
        reply = data;
      }

      return NextResponse.json({ reply });
    }

    if (action === "save") {
      // Save edited reply text
      const { data: existingReply } = await supabase
        .from("replies")
        .select("id")
        .eq("review_id", reviewId)
        .single();

      if (existingReply) {
        const { data } = await supabase
          .from("replies")
          .update({ final_text: replyText, status: "approved" })
          .eq("id", existingReply.id)
          .select()
          .single();
        return NextResponse.json({ reply: data });
      }

      const { data } = await supabase
        .from("replies")
        .insert({
          review_id: reviewId,
          generated_text: replyText,
          final_text: replyText,
          status: "approved",
        })
        .select()
        .single();

      return NextResponse.json({ reply: data });
    }

    if (action === "publish") {
      const textToPublish = replyText;

      // Post to Google if connected
      if (business.google_access_token && review.google_review_id) {
        await postReplyToGoogle(business, review.google_review_id, textToPublish, supabase);
      }

      // Update reply status
      const { data: existingReply } = await supabase
        .from("replies")
        .select("id")
        .eq("review_id", reviewId)
        .single();

      let reply;
      if (existingReply) {
        const { data } = await supabase
          .from("replies")
          .update({
            final_text: textToPublish,
            status: "published",
            published_at: new Date().toISOString(),
          })
          .eq("id", existingReply.id)
          .select()
          .single();
        reply = data;
      } else {
        const { data } = await supabase
          .from("replies")
          .insert({
            review_id: reviewId,
            generated_text: textToPublish,
            final_text: textToPublish,
            status: "published",
            published_at: new Date().toISOString(),
          })
          .select()
          .single();
        reply = data;
      }

      // Update review status
      await supabase
        .from("reviews")
        .update({ status: "manually_replied" })
        .eq("id", reviewId);

      return NextResponse.json({ reply });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Reply error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reply failed" },
      { status: 500 }
    );
  }
}

async function generateAIReply(
  review: { review_text: string | null; reviewer_name: string; rating: number },
  business: { tone_description: string; example_responses: string[]; negative_review_strategy: string }
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const sentiment = review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative";

  const examplesSection = business.example_responses?.length
    ? `\n\nExample responses from this business:\n${business.example_responses.map((r: string, i: number) => `${i + 1}. "${r}"`).join("\n")}`
    : "";

  let negativeStrategy = "";
  if (sentiment === "negative") {
    const strategies: Record<string, string> = {
      apologize_resolve: "Apologize sincerely and offer to resolve the issue. Provide a way to follow up.",
      acknowledge_redirect: "Acknowledge the concern and redirect to a private channel for resolution.",
      flag_manual: "Provide a brief, professional acknowledgment.",
    };
    negativeStrategy = `\nNegative review strategy: ${strategies[business.negative_review_strategy] || strategies.apologize_resolve}`;
  }

  const prompt = `You are a review response assistant. Generate a professional, genuine reply to this Google review.

Business tone/voice: ${business.tone_description}${examplesSection}${negativeStrategy}

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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("Failed to generate reply");
  return reply;
}
