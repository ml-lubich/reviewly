import { SupabaseClient } from "@supabase/supabase-js";
import { getValidAccessToken } from "./google-oauth";
import type { Business } from "./types";

const GBP_API = "https://mybusiness.googleapis.com/v4";

interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export async function fetchGoogleReviews(
  business: Business,
  supabase: SupabaseClient
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  const accessToken = await getValidAccessToken(business, async (newToken, expiresAt) => {
    await supabase
      .from("businesses")
      .update({
        google_access_token: newToken,
        google_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", business.id);
  });

  const accountId = business.google_account_id;
  const locationId = business.google_location_id;

  if (!accountId || !locationId) {
    throw new Error("Business missing Google account/location IDs");
  }

  let pageToken: string | undefined;

  do {
    const url = new URL(`${GBP_API}/${accountId}/${locationId}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Reviews API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const reviews: GoogleReview[] = data.reviews || [];
    pageToken = data.nextPageToken;

    for (const review of reviews) {
      try {
        const rating = STAR_RATING_MAP[review.starRating] || 5;

        // Upsert review by google_review_id
        const { data: existing } = await supabase
          .from("reviews")
          .select("id, status")
          .eq("google_review_id", review.reviewId)
          .single();

        if (existing) {
          // Update review text/rating if changed
          await supabase
            .from("reviews")
            .update({
              reviewer_name: review.reviewer.displayName,
              reviewer_photo_url: review.reviewer.profilePhotoUrl || null,
              rating,
              review_text: review.comment || null,
              review_date: review.createTime,
            })
            .eq("id", existing.id);
        } else {
          // Determine status based on whether Google already has a reply
          const status = review.reviewReply ? "auto_replied" : "pending";

          const { data: newReview } = await supabase
            .from("reviews")
            .insert({
              business_id: business.id,
              google_review_id: review.reviewId,
              reviewer_name: review.reviewer.displayName,
              reviewer_photo_url: review.reviewer.profilePhotoUrl || null,
              rating,
              review_text: review.comment || null,
              review_date: review.createTime,
              status,
            })
            .select("id")
            .single();

          // If Google already has a reply, store it
          if (review.reviewReply && newReview) {
            await supabase.from("replies").insert({
              review_id: newReview.id,
              generated_text: review.reviewReply.comment,
              final_text: review.reviewReply.comment,
              status: "published",
              published_at: review.reviewReply.updateTime,
            });
          }
        }

        synced++;
      } catch (err) {
        console.error(`Error syncing review ${review.reviewId}:`, err);
        errors++;
      }
    }
  } while (pageToken);

  return { synced, errors };
}

export async function postReplyToGoogle(
  business: Business,
  googleReviewId: string,
  replyText: string,
  supabase: SupabaseClient
): Promise<void> {
  const accessToken = await getValidAccessToken(business, async (newToken, expiresAt) => {
    await supabase
      .from("businesses")
      .update({
        google_access_token: newToken,
        google_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", business.id);
  });

  const accountId = business.google_account_id;
  const locationId = business.google_location_id;

  const url = `${GBP_API}/${accountId}/${locationId}/reviews/${googleReviewId}/reply`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to post reply to Google: ${res.status} ${err}`);
  }
}
