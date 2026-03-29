export interface Business {
  id: string;
  owner_id: string;
  google_place_id: string | null;
  google_account_id: string | null;
  google_location_id: string | null;
  business_name: string;
  tone_description: string;
  example_responses: string[];
  negative_review_strategy: string;
  auto_reply_enabled: boolean;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = "pending" | "auto_replied" | "manually_replied" | "skipped";
export type ReplyStatus = "draft" | "approved" | "published";
export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export interface Review {
  id: string;
  business_id: string;
  google_review_id: string | null;
  reviewer_name: string;
  reviewer_photo_url: string | null;
  rating: number;
  review_text: string | null;
  review_date: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  reply?: Reply | null;
}

export interface Reply {
  id: string;
  review_id: string;
  generated_text: string;
  final_text: string | null;
  status: ReplyStatus;
  published_at: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_tone: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: SubscriptionTier;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessStats {
  total_reviews: number;
  pending_replies: number;
  replied_count: number;
  average_rating: number;
}
