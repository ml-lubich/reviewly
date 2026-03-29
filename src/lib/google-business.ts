import { SupabaseClient } from "@supabase/supabase-js";
import { getValidAccessToken } from "./google-oauth";
import { GOOGLE_REVIEWS_PAGE_SIZE } from "./constants";
import type { Business } from "./types";

const GBP_API = "https://mybusiness.googleapis.com/v4";
const RATE_LIMIT_STATUS = 429;
const RATE_LIMIT_RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 2;

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

const STAR_RATING_TO_NUMBER: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

type TokenRefreshCallback = (newToken: string, expiresAt: Date) => Promise<void>;

function createTokenRefreshCallback(
  supabase: SupabaseClient,
  businessId: string
): TokenRefreshCallback {
  return async (newToken: string, expiresAt: Date) => {
    await supabase
      .from("businesses")
      .update({
        google_access_token: newToken,
        google_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", businessId);
  };
}

export async function fetchGoogleReviews(
  business: Business,
  supabase: SupabaseClient
): Promise<{ synced: number; errors: number }> {
  const accessToken = await getValidAccessToken(
    business,
    createTokenRefreshCallback(supabase, business.id)
  );

  const accountId = business.google_account_id;
  const locationId = business.google_location_id;

  if (!accountId || !locationId) {
    throw new Error("Business missing Google account/location IDs");
  }

  let synced = 0;
  let errors = 0;
  let pageToken: string | undefined;

  do {
    const { reviews, nextPageToken } = await fetchReviewsPage(accessToken, accountId, locationId, pageToken);
    pageToken = nextPageToken;

    for (const review of reviews) {
      try {
        await upsertGoogleReview(supabase, business.id, review);
        synced++;
      } catch (err) {
        console.error(`Error syncing review ${review.reviewId}:`, err);
        errors++;
      }
    }
  } while (pageToken);

  return { synced, errors };
}

async function fetchReviewsPage(
  accessToken: string,
  accountId: string,
  locationId: string,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string }> {
  const url = new URL(`${GBP_API}/${accountId}/${locationId}/reviews`);
  url.searchParams.set("pageSize", GOOGLE_REVIEWS_PAGE_SIZE);
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetchWithRateLimitRetry(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Reviews API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
  };
}

async function fetchWithRateLimitRetry(
  url: string,
  init: RequestInit,
  retries = 0
): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status === RATE_LIMIT_STATUS && retries < MAX_RETRIES) {
    const retryAfter = res.headers.get("Retry-After");
    const delayMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : RATE_LIMIT_RETRY_DELAY_MS * (retries + 1);

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetchWithRateLimitRetry(url, init, retries + 1);
  }

  return res;
}

async function upsertGoogleReview(
  supabase: SupabaseClient,
  businessId: string,
  review: GoogleReview
): Promise<void> {
  const rating = STAR_RATING_TO_NUMBER[review.starRating] || 5;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("google_review_id", review.reviewId)
    .single();

  if (existing) {
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
    return;
  }

  const status = review.reviewReply ? "auto_replied" : "pending";

  const { data: newReview } = await supabase
    .from("reviews")
    .insert({
      business_id: businessId,
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

export async function postReplyToGoogle(
  business: Business,
  googleReviewId: string,
  replyText: string,
  supabase: SupabaseClient
): Promise<void> {
  const accessToken = await getValidAccessToken(
    business,
    createTokenRefreshCallback(supabase, business.id)
  );

  const accountId = business.google_account_id;
  const locationId = business.google_location_id;

  const url = `${GBP_API}/${accountId}/${locationId}/reviews/${googleReviewId}/reply`;

  const res = await fetchWithRateLimitRetry(url, {
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
