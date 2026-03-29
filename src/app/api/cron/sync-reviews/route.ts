import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchGoogleReviews, postReplyToGoogle } from "@/lib/google-business";
import { generateReviewReply } from "@/lib/openai";
import { getCronSecret, getSupabaseServiceRoleKey } from "@/lib/env";
import {
  REVIEW_STATUS_PENDING,
  REVIEW_STATUS_AUTO_REPLIED,
  REPLY_STATUS_PUBLISHED,
  STRATEGY_FLAG_MANUAL,
  NEUTRAL_RATING,
  AUTO_REPLY_BATCH_LIMIT,
} from "@/lib/constants";
import type { Business, Review } from "@/lib/types";
import { SupabaseClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = getCronSecret();
  const serviceKey = getSupabaseServiceRoleKey();

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (serviceKey && authHeader === `Bearer ${serviceKey}`);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("*")
      .not("google_access_token", "is", null);

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: "No connected businesses" });
    }

    const results = await Promise.all(
      businesses.map((business) => syncAndAutoReplyForBusiness(business, supabase))
    );

    return NextResponse.json({ results, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}

async function syncAndAutoReplyForBusiness(
  business: Business,
  supabase: SupabaseClient
) {
  try {
    const syncResult = await fetchGoogleReviews(business, supabase);
    let autoReplied = 0;

    if (business.auto_reply_enabled) {
      autoReplied = await processAutoReplies(business, supabase);
    }

    return {
      business: business.business_name,
      synced: syncResult.synced,
      errors: syncResult.errors,
      autoReplied,
    };
  } catch (err) {
    return {
      business: business.business_name,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function processAutoReplies(
  business: Business,
  supabase: SupabaseClient
): Promise<number> {
  const { data: pendingReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("business_id", business.id)
    .eq("status", REVIEW_STATUS_PENDING)
    .order("review_date", { ascending: true })
    .limit(AUTO_REPLY_BATCH_LIMIT);

  if (!pendingReviews || pendingReviews.length === 0) return 0;

  const reviewsToReply = business.negative_review_strategy === STRATEGY_FLAG_MANUAL
    ? pendingReviews.filter((r: Review) => r.rating >= NEUTRAL_RATING)
    : pendingReviews;

  let autoReplied = 0;

  for (const review of reviewsToReply) {
    try {
      await autoReplyToReview(review, business, supabase);
      autoReplied++;
    } catch (err) {
      console.error(`Auto-reply failed for review ${review.id}:`, err);
    }
  }

  return autoReplied;
}

async function autoReplyToReview(
  review: Review,
  business: Business,
  supabase: SupabaseClient
): Promise<void> {
  const replyText = await generateReviewReply(review, business);

  await supabase.from("replies").insert({
    review_id: review.id,
    generated_text: replyText,
    final_text: replyText,
    status: REPLY_STATUS_PUBLISHED,
    published_at: new Date().toISOString(),
  });

  if (review.google_review_id) {
    await postReplyToGoogle(business, review.google_review_id, replyText, supabase);
  }

  await supabase
    .from("reviews")
    .update({ status: REVIEW_STATUS_AUTO_REPLIED })
    .eq("id", review.id);
}
