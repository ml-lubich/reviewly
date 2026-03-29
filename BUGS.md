# BUGS.md — Reviewly Audit

## Critical Bugs

### BUG-001: `/api/generate-reply` has no authentication
**File**: `src/app/api/generate-reply/route.ts`
**Severity**: CRITICAL
**Details**: Endpoint accepts unauthenticated requests. Anyone can generate AI replies using the app's OpenAI API key, burning credits and exposing business data.

### BUG-002: OAuth tokens stored unencrypted
**File**: `supabase/schema.sql`, `src/app/api/google/callback/route.ts`
**Severity**: HIGH
**Details**: CLAUDE.md mandates "Encrypt stored OAuth tokens" but `google_access_token` and `google_refresh_token` are stored as plain text. If DB is compromised, all Google Business tokens are exposed.

### BUG-003: Google Business Profile API uses deprecated v4 endpoint
**File**: `src/lib/google-business.ts`
**Severity**: HIGH
**Details**: Uses `mybusiness.googleapis.com/v4` which is deprecated. The callback uses the correct v1 APIs (`mybusinessaccountmanagement.googleapis.com/v1` and `mybusinessbusinessinformation.googleapis.com/v1`). The reviews fetch will fail in production.

## Clean Code Violations

### CC-001: DRY — AI reply generation duplicated 3 times
**Files**: `src/app/api/generate-reply/route.ts`, `src/app/api/reviews/[id]/reply/route.ts`, `src/app/api/cron/sync-reviews/route.ts`
**Details**: Three separate `generateAutoReply`/`generateAIReply` functions with identical logic. Should be extracted to `lib/openai.ts`.

### CC-002: DRY — Stats calculation duplicated
**Files**: `src/app/dashboard/page.tsx` (loadData + syncReviews), `src/lib/data.ts`
**Details**: Stats calculation (total, pending, replied, average) is duplicated in both `syncReviews` and `loadData` in the dashboard, and also exists in `lib/data.ts`.

### CC-003: DRY — Supabase client creation duplicated in auth routes
**Files**: `src/app/api/auth/callback/route.ts`, `src/app/api/auth/signout/route.ts`
**Details**: Both manually create Supabase server clients instead of using `createServerSupabaseClient()`.

### CC-004: SRP — `reviews/[id]/reply/route.ts` handles 3 actions in one function
**File**: `src/app/api/reviews/[id]/reply/route.ts`
**Details**: Single POST handler manages generate, save, and publish. Function is 170+ lines. Each action should be a separate handler or extracted function.

### CC-005: SRP — `google/callback/route.ts` is 100+ lines
**File**: `src/app/api/google/callback/route.ts`
**Details**: Handles token exchange, account fetching, location fetching, and business upsert all in one function.

### CC-006: Empty catch blocks throughout
**Files**: Dashboard page, settings page, analytics page, dashboard layout
**Details**: All catch blocks are empty `catch {}` — errors are silently swallowed with no user feedback.

### CC-007: No OpenAI client shared — created on every request
**Files**: `src/app/api/cron/sync-reviews/route.ts`, `src/app/api/reviews/[id]/reply/route.ts`
**Details**: `new OpenAI()` called inside request handlers instead of module-level singleton.

### CC-008: Magic strings for review/reply statuses
**Files**: Multiple
**Details**: Status strings like "pending", "auto_replied", etc. are hardcoded throughout instead of using named constants from a shared module.

## Missing Features

### MISS-001: No Stripe integration
**Details**: No Stripe package, no webhook handler, no checkout flow, no feature gating by tier.

### MISS-002: No error boundary components
**Details**: No React error boundaries anywhere in the app.

### MISS-003: No environment variable validation at startup
**Details**: All env vars use `!` non-null assertions. No validation at app boot.

### MISS-004: No `lib/openai.ts` module
**Details**: CLAUDE.md architecture shows `lib/openai.ts` but it doesn't exist. OpenAI logic is scattered across route handlers.
