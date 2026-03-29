import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateReviewReply } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reviewText, reviewerName, rating, toneDescription, exampleResponses } = body;

    if (!reviewText || !rating || !toneDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const generatedReply = await generateReviewReply(
      { review_text: reviewText, reviewer_name: reviewerName || "Customer", rating },
      { tone_description: toneDescription, example_responses: exampleResponses || [], negative_review_strategy: "apologize_resolve" }
    );

    return NextResponse.json({ reply: generatedReply });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate reply" },
      { status: 500 }
    );
  }
}
