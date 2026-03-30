import { createClient } from "@/lib/supabase";
import type { Review, BusinessStats } from "@/lib/types";

export const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" as const },
  auto_replied: { label: "Auto-replied", variant: "success" as const },
  manually_replied: { label: "Replied", variant: "success" as const },
  skipped: { label: "Skipped", variant: "secondary" as const },
};

export const EMPTY_STATS: BusinessStats = {
  total_reviews: 0,
  pending_replies: 0,
  replied_count: 0,
  average_rating: 0,
};

export function formatLastSynced(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function countReviewsThisMonth(reviews: Review[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return reviews.filter(
    (r) => new Date(r.review_date) >= startOfMonth
  ).length;
}

export function mapReviewsFromSupabase(revs: Record<string, unknown>[]): Review[] {
  return revs.map((r) => ({
    ...r,
    reply: Array.isArray(r.reply) && r.reply.length > 0 ? r.reply[0] : null,
  })) as Review[];
}

export async function fetchReviewsForBusiness(
  supabase: ReturnType<typeof createClient>,
  businessId: string
): Promise<Review[]> {
  const { data: revs, error } = await supabase
    .from("reviews")
    .select("*, reply:replies(*)")
    .eq("business_id", businessId)
    .order("review_date", { ascending: false });

  if (error) throw error;
  return mapReviewsFromSupabase(revs || []);
}
