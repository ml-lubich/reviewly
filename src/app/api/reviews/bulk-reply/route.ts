import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { postReplyToGoogle } from "@/lib/google-business";
import { generateReviewReply } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  REPLY_STATUS_DRAFT,
  REPLY_STATUS_PUBLISHED,
  REVIEW_STATUS_PENDING,
  REVIEW_STATUS_MANUALLY_REPLIED,
  RATE_LIMIT_GENERATE_REPLY,
} from "@/lib/constants";

const MAX_BULK_REVIEW_IDS = 50;

interface BulkResultItem {
  reviewId: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = checkRateLimit(
    `bulk-reply:${user.id}`,
    RATE_LIMIT_GENERATE_REPLY
  );
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json();
  const { reviewIds, action } = body;

  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    return NextResponse.json(
      { error: "reviewIds must be a non-empty array" },
      { status: 400 }
    );
  }

  if (reviewIds.length > MAX_BULK_REVIEW_IDS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_BULK_REVIEW_IDS} reviews per bulk action` },
      { status: 400 }
    );
  }

  if (action !== "generate" && action !== "publish") {
    return NextResponse.json(
      { error: "Action must be 'generate' or 'publish'" },
      { status: 400 }
    );
  }

  const { data: reviews, error: fetchError } = await supabase
    .from("reviews")
    .select("*, business:businesses(*), reply:replies(*)")
    .in("id", reviewIds);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }

  if (!reviews || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews found" }, { status: 404 });
  }

  const ownedReviews = reviews.filter((r) => {
    const business = Array.isArray(r.business) ? r.business[0] : r.business;
    return business && business.owner_id === user.id;
  });

  if (ownedReviews.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const results: BulkResultItem[] =
    action === "generate"
      ? await bulkGenerate(supabase, ownedReviews)
      : await bulkPublish(supabase, ownedReviews);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ results, succeeded, failed });
}

async function bulkGenerate(
  supabase: SupabaseClient,
  reviews: Record<string, unknown>[]
): Promise<BulkResultItem[]> {
  const results: BulkResultItem[] = [];

  for (const review of reviews) {
    const reviewId = review.id as string;
    const status = review.status as string;

    if (status !== REVIEW_STATUS_PENDING) {
      results.push({
        reviewId,
        success: false,
        error: "Review is not pending",
      });
      continue;
    }

    const business = Array.isArray(review.business)
      ? review.business[0]
      : review.business;

    try {
      const generatedText = await generateReviewReply(
        review as { review_text: string | null; reviewer_name: string; rating: number },
        business as {
          tone_description: string;
          example_responses: string[];
          negative_review_strategy: string;
        }
      );

      await upsertReply(supabase, reviewId, {
        generated_text: generatedText,
        final_text: generatedText,
        status: REPLY_STATUS_DRAFT,
      });

      results.push({ reviewId, success: true });
    } catch (err) {
      results.push({
        reviewId,
        success: false,
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  }

  return results;
}

async function bulkPublish(
  supabase: SupabaseClient,
  reviews: Record<string, unknown>[]
): Promise<BulkResultItem[]> {
  const results: BulkResultItem[] = [];

  for (const review of reviews) {
    const reviewId = review.id as string;
    const reply = Array.isArray(review.reply) ? review.reply[0] : review.reply;

    if (!reply || !reply.final_text) {
      results.push({
        reviewId,
        success: false,
        error: "No draft reply to publish",
      });
      continue;
    }

    if (reply.status === REPLY_STATUS_PUBLISHED) {
      results.push({
        reviewId,
        success: false,
        error: "Reply already published",
      });
      continue;
    }

    const business = Array.isArray(review.business)
      ? review.business[0]
      : review.business;

    try {
      if (business.google_access_token && review.google_review_id) {
        await postReplyToGoogle(
          business as Parameters<typeof postReplyToGoogle>[0],
          review.google_review_id as string,
          reply.final_text as string,
          supabase
        );
      }

      await supabase
        .from("replies")
        .update({
          status: REPLY_STATUS_PUBLISHED,
          published_at: new Date().toISOString(),
        })
        .eq("id", reply.id);

      await supabase
        .from("reviews")
        .update({ status: REVIEW_STATUS_MANUALLY_REPLIED })
        .eq("id", reviewId);

      results.push({ reviewId, success: true });
    } catch (err) {
      results.push({
        reviewId,
        success: false,
        error: err instanceof Error ? err.message : "Publish failed",
      });
    }
  }

  return results;
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
