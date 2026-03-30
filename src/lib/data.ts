import { SupabaseClient } from "@supabase/supabase-js";
import type { Business, Review, Reply, BusinessStats, Subscription } from "./types";
import {
  REVIEW_STATUS_PENDING,
  REVIEW_STATUS_AUTO_REPLIED,
  REVIEW_STATUS_MANUALLY_REPLIED,
  POSITIVE_RATING_THRESHOLD,
  NEUTRAL_RATING,
  SORT_OLDEST,
  SORT_HIGHEST_RATED,
  SORT_LOWEST_RATED,
} from "./constants";
import type { ReviewSortValue } from "./constants";

export async function getBusinessesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBusinessById(
  supabase: SupabaseClient,
  businessId: string
): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (error) return null;
  return data;
}

export async function getReviewsForBusiness(
  supabase: SupabaseClient,
  businessId: string,
  filters?: { status?: string; rating?: number }
): Promise<Review[]> {
  let query = supabase
    .from("reviews")
    .select("*, reply:replies(*)")
    .eq("business_id", businessId)
    .order("review_date", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.rating && filters.rating > 0) {
    query = query.eq("rating", filters.rating);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((r) => ({
    ...r,
    reply: r.reply?.[0] || null,
  }));
}

export async function getReviewById(
  supabase: SupabaseClient,
  reviewId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reply:replies(*)")
    .eq("id", reviewId)
    .single();

  if (error) return null;
  return { ...data, reply: data.reply?.[0] || null };
}

export function calculateBusinessStats(reviews: { rating: number; status: string }[]): BusinessStats {
  const total = reviews.length;
  const pending = reviews.filter((r) => r.status === REVIEW_STATUS_PENDING).length;
  const replied = reviews.filter(
    (r) => r.status === REVIEW_STATUS_AUTO_REPLIED || r.status === REVIEW_STATUS_MANUALLY_REPLIED
  ).length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
    : 0;

  return {
    total_reviews: total,
    pending_replies: pending,
    replied_count: replied,
    average_rating: avgRating,
  };
}

export async function getBusinessStats(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessStats> {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("rating, status")
    .eq("business_id", businessId);

  if (error || !reviews) {
    return { total_reviews: 0, pending_replies: 0, replied_count: 0, average_rating: 0 };
  }

  return calculateBusinessStats(reviews);
}

export async function createReply(
  supabase: SupabaseClient,
  reviewId: string,
  generatedText: string,
  finalText?: string
): Promise<Reply> {
  const { data, error } = await supabase
    .from("replies")
    .insert({
      review_id: reviewId,
      generated_text: generatedText,
      final_text: finalText || generatedText,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReply(
  supabase: SupabaseClient,
  replyId: string,
  updates: Partial<Pick<Reply, "final_text" | "status" | "published_at">>
): Promise<Reply> {
  const { data, error } = await supabase
    .from("replies")
    .update(updates)
    .eq("id", replyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReviewStatus(
  supabase: SupabaseClient,
  reviewId: string,
  status: Review["status"]
): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ status })
    .eq("id", reviewId);

  if (error) throw error;
}

export async function updateBusiness(
  supabase: SupabaseClient,
  businessId: string,
  updates: Partial<Pick<Business, "tone_description" | "example_responses" | "auto_reply_enabled" | "negative_review_strategy" | "business_name">>
): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubscriptionForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export function sortReviews<T extends { rating: number; review_date: string }>(
  reviews: T[],
  sortBy: ReviewSortValue
): T[] {
  const sorted = [...reviews];
  switch (sortBy) {
    case SORT_OLDEST:
      return sorted.sort((a, b) => new Date(a.review_date).getTime() - new Date(b.review_date).getTime());
    case SORT_HIGHEST_RATED:
      return sorted.sort((a, b) => b.rating - a.rating);
    case SORT_LOWEST_RATED:
      return sorted.sort((a, b) => a.rating - b.rating);
    default:
      return sorted.sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
  }
}

export async function getAnalyticsData(
  supabase: SupabaseClient,
  businessId: string
) {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("rating, status, review_date, created_at")
    .eq("business_id", businessId);

  if (error || !reviews) return null;

  const total = reviews.length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;

  const replied = reviews.filter(
    (r) => r.status === REVIEW_STATUS_AUTO_REPLIED || r.status === REVIEW_STATUS_MANUALLY_REPLIED
  ).length;
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star} star`,
    value: reviews.filter((r) => r.rating === star).length,
  }));

  const now = new Date();
  const monthlyReviews = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.toLocaleString("en", { month: "short" });
    const count = reviews.filter((r) => {
      const rd = new Date(r.review_date);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    }).length;
    return { label: month, value: count };
  });

  const positive = reviews.filter((r) => r.rating >= POSITIVE_RATING_THRESHOLD).length;
  const neutral = reviews.filter((r) => r.rating === NEUTRAL_RATING).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  return {
    avgRating,
    replyRate,
    totalReviews: total,
    ratingDistribution,
    monthlyReviews,
    sentiment: {
      positive: total > 0 ? Math.round((positive / total) * 100) : 0,
      neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
      negative: total > 0 ? Math.round((negative / total) * 100) : 0,
    },
  };
}
