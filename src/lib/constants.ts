// Review statuses
export const REVIEW_STATUS_PENDING = "pending" as const;
export const REVIEW_STATUS_AUTO_REPLIED = "auto_replied" as const;
export const REVIEW_STATUS_MANUALLY_REPLIED = "manually_replied" as const;
export const REVIEW_STATUS_SKIPPED = "skipped" as const;

// Reply statuses
export const REPLY_STATUS_DRAFT = "draft" as const;
export const REPLY_STATUS_APPROVED = "approved" as const;
export const REPLY_STATUS_PUBLISHED = "published" as const;

// Rating thresholds
export const POSITIVE_RATING_THRESHOLD = 4;
export const NEUTRAL_RATING = 3;

// AI generation
export const AI_MODEL = "gpt-4o";
export const AI_TEMPERATURE = 0.7;
export const AI_MAX_TOKENS_REPLY = 300;
export const AI_MAX_TOKENS_AUTO_REPLY = 250;

// Google API
export const GOOGLE_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
export const GOOGLE_REVIEWS_PAGE_SIZE = "50";

// Negative review strategies
export const STRATEGY_APOLOGIZE_RESOLVE = "apologize_resolve" as const;
export const STRATEGY_ACKNOWLEDGE_REDIRECT = "acknowledge_redirect" as const;
export const STRATEGY_FLAG_MANUAL = "flag_manual" as const;

export const NEGATIVE_STRATEGY_INSTRUCTIONS: Record<string, string> = {
  [STRATEGY_APOLOGIZE_RESOLVE]: "Apologize sincerely and offer to resolve the issue. Provide a way to follow up.",
  [STRATEGY_ACKNOWLEDGE_REDIRECT]: "Acknowledge the concern and redirect to a private channel for resolution.",
  [STRATEGY_FLAG_MANUAL]: "Provide a brief, professional acknowledgment.",
};

// Stripe tiers
export const FREE_TIER_BUSINESSES = 1;
export const STARTER_TIER_BUSINESSES = 1;
export const PROFESSIONAL_TIER_BUSINESSES = 5;
export const ENTERPRISE_TIER_BUSINESSES = Infinity;

// Search
export const SEARCH_DEBOUNCE_MS = 300;
export const NEGATIVE_RATING_MAX = 2;

// Pagination
export const REVIEWS_PER_PAGE = 10;

// Auto-reply
export const AUTO_REPLY_BATCH_LIMIT = 10;

// Response time buckets (milliseconds)
export const RESPONSE_TIME_1H_MS = 3_600_000;
export const RESPONSE_TIME_6H_MS = 21_600_000;
export const RESPONSE_TIME_24H_MS = 86_400_000;
export const RESPONSE_TIME_3D_MS = 259_200_000;

// Rate limiting (requests per window)
export const RATE_LIMIT_GENERATE_REPLY = { maxRequests: 20, windowMs: 60_000 };
export const RATE_LIMIT_REVIEWS_SYNC = { maxRequests: 5, windowMs: 60_000 };
export const RATE_LIMIT_STRIPE_CHECKOUT = { maxRequests: 3, windowMs: 60_000 };
export const RATE_LIMIT_STRIPE_PORTAL = { maxRequests: 5, windowMs: 60_000 };
export const RATE_LIMIT_GOOGLE_CONNECT = { maxRequests: 3, windowMs: 60_000 };
