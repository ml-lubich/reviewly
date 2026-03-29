import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { postReplyToGoogle } from "@/lib/google-business";
import { generateReviewReply } from "@/lib/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  REPLY_STATUS_DRAFT,
  REPLY_STATUS_APPROVED,
  REPLY_STATUS_PUBLISHED,
  REVIEW_STATUS_MANUALLY_REPLIED,
} from "@/lib/constants";

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
    switch (action) {
      case "generate":
        return await handleGenerateReply(supabase, reviewId, review, business);
      case "save":
        return await handleSaveReply(supabase, reviewId, replyText);
      case "publish":
        return await handlePublishReply(supabase, reviewId, replyText, review, business);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Reply error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reply failed" },
      { status: 500 }
    );
  }
}

async function handleGenerateReply(
  supabase: SupabaseClient,
  reviewId: string,
  review: { review_text: string | null; reviewer_name: string; rating: number },
  business: { tone_description: string; example_responses: string[]; negative_review_strategy: string }
) {
  const generatedText = await generateReviewReply(review, business);
  const reply = await upsertReply(supabase, reviewId, {
    generated_text: generatedText,
    final_text: generatedText,
    status: REPLY_STATUS_DRAFT,
  });
  return NextResponse.json({ reply });
}

async function handleSaveReply(
  supabase: SupabaseClient,
  reviewId: string,
  replyText: string
) {
  const reply = await upsertReply(supabase, reviewId, {
    generated_text: replyText,
    final_text: replyText,
    status: REPLY_STATUS_APPROVED,
  });
  return NextResponse.json({ reply });
}

async function handlePublishReply(
  supabase: SupabaseClient,
  reviewId: string,
  replyText: string,
  review: { google_review_id: string | null },
  business: { google_access_token: string | null; id: string }
) {
  if (business.google_access_token && review.google_review_id) {
    await postReplyToGoogle(business as Parameters<typeof postReplyToGoogle>[0], review.google_review_id, replyText, supabase);
  }

  const reply = await upsertReply(supabase, reviewId, {
    generated_text: replyText,
    final_text: replyText,
    status: REPLY_STATUS_PUBLISHED,
    published_at: new Date().toISOString(),
  });

  await supabase
    .from("reviews")
    .update({ status: REVIEW_STATUS_MANUALLY_REPLIED })
    .eq("id", reviewId);

  return NextResponse.json({ reply });
}

async function upsertReply(
  supabase: SupabaseClient,
  reviewId: string,
  fields: Record<string, unknown>
) {
  const { data: existing } = await supabase
    .from("replies")
    .select("id")
    .eq("review_id", reviewId)
    .single();

  if (existing) {
    const { data } = await supabase
      .from("replies")
      .update(fields)
      .eq("id", existing.id)
      .select()
      .single();
    return data;
  }

  const { data } = await supabase
    .from("replies")
    .insert({ review_id: reviewId, ...fields })
    .select()
    .single();
  return data;
}
