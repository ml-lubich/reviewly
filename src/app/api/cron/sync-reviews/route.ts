import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchGoogleReviews, postReplyToGoogle } from "@/lib/google-business";
import OpenAI from "openai";

// This endpoint is called by a cron job (Vercel Cron or external scheduler)
// Protected by CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (serviceKey && authHeader === `Bearer ${serviceKey}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Fetch all businesses with Google tokens
    const { data: businesses } = await supabase
      .from("businesses")
      .select("*")
      .not("google_access_token", "is", null);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: "No connected businesses" });
    }

    const results = [];

    for (const business of businesses) {
      try {
        // Step 1: Sync reviews from Google
        const syncResult = await fetchGoogleReviews(business, supabase);

        // Step 2: If auto-reply enabled, process pending reviews
        let autoReplied = 0;
        if (business.auto_reply_enabled) {
          const { data: pendingReviews } = await supabase
            .from("reviews")
            .select("*")
            .eq("business_id", business.id)
            .eq("status", "pending")
            .order("review_date", { ascending: true })
            .limit(10);

          if (pendingReviews && pendingReviews.length > 0) {
            // Skip negative reviews if strategy is "flag_manual"
            const reviewsToReply = business.negative_review_strategy === "flag_manual"
              ? pendingReviews.filter((r) => r.rating >= 3)
              : pendingReviews;

            for (const review of reviewsToReply) {
              try {
                const replyText = await generateAutoReply(review, business);

                // Save reply to DB
                await supabase.from("replies").insert({
                  review_id: review.id,
                  generated_text: replyText,
                  final_text: replyText,
                  status: "published",
                  published_at: new Date().toISOString(),
                });

                // Post to Google
                if (review.google_review_id) {
                  await postReplyToGoogle(business, review.google_review_id, replyText, supabase);
                }

                // Update review status
                await supabase
                  .from("reviews")
                  .update({ status: "auto_replied" })
                  .eq("id", review.id);

                autoReplied++;
              } catch (err) {
                console.error(`Auto-reply failed for review ${review.id}:`, err);
              }
            }
          }
        }

        results.push({
          business: business.business_name,
          synced: syncResult.synced,
          errors: syncResult.errors,
          autoReplied,
        });
      } catch (err) {
        results.push({
          business: business.business_name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}

async function generateAutoReply(
  review: { review_text: string | null; reviewer_name: string; rating: number },
  business: { tone_description: string; example_responses: string[]; negative_review_strategy: string }
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const sentiment = review.rating >= 4 ? "positive" : review.rating === 3 ? "neutral" : "negative";

  const strategies: Record<string, string> = {
    apologize_resolve: "Apologize sincerely and offer to resolve the issue.",
    acknowledge_redirect: "Acknowledge the concern and redirect to a private channel.",
    flag_manual: "Provide a brief, professional acknowledgment.",
  };

  const prompt = `Generate a reply to this Google review.

Tone: ${business.tone_description}
${business.example_responses?.length ? `Examples: ${business.example_responses.join(" | ")}` : ""}

Review by ${review.reviewer_name}: ${review.rating}/5 stars - "${review.review_text || "(no text)"}"
${sentiment === "negative" ? `Strategy: ${strategies[business.negative_review_strategy] || strategies.apologize_resolve}` : ""}

2-4 sentences. Address by name. Sound human. Reply text only.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 250,
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new Error("Failed to generate auto-reply");
  return reply;
}
