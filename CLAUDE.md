# CLAUDE.md — Reviewly

## Project Overview
Reviewly is a SaaS where businesses connect their Google Business Profile and automatically reply to Google Reviews using AI, in their own configured tone/voice.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Auth**: Supabase Google OAuth (login) + Google Business Profile OAuth (consent)
- **AI**: OpenAI GPT-4o (reply generation)
- **Google API**: Business Profile API v1/v4 (fetch reviews + post replies)
- **Payments**: Stripe (checkout + customer portal + webhooks)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Architecture
```
src/
├── app/
│   ├── api/
│   │   ├── auth/            # Supabase auth callback + signout
│   │   ├── google/          # Google Business Profile OAuth (connect + callback)
│   │   ├── businesses/      # Business CRUD
│   │   ├── reviews/         # Review sync + reply
│   │   ├── webhooks/stripe/ # Stripe webhooks
│   │   ├── stripe/          # Checkout + portal
│   │   ├── cron/            # Review sync cron
│   │   ├── health/          # Health check
│   │   └── generate-reply/  # AI reply generation (authenticated)
│   ├── dashboard/           # Business dashboard + settings + analytics
│   ├── login/               # Login page
│   ├── error.tsx            # Global error page
│   └── not-found.tsx        # 404 page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── error-boundary.tsx   # React error boundary
│   ├── star-rating.tsx
│   ├── theme-toggle.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── constants.ts         # Named constants (statuses, thresholds, strategies)
│   ├── data.ts              # Supabase data access layer
│   ├── env.ts               # Validated environment variable accessors
│   ├── google-business.ts   # Google Business Profile API client
│   ├── google-oauth.ts      # Google OAuth token management
│   ├── openai.ts            # Shared AI reply generation
│   ├── stripe.ts            # Stripe client + tier config
│   ├── subscription.ts      # Feature gating by subscription tier
│   ├── supabase.ts          # Browser Supabase client
│   ├── supabase-server.ts   # Server Supabase client
│   ├── supabase-admin.ts    # Admin Supabase client (service role)
│   ├── types.ts             # TypeScript interfaces
│   └── utils.ts             # Utility functions (cn)
└── proxy.ts                 # Auth proxy (middleware)
```

## TWO OAuth Flows (Important!)
1. **Login OAuth** — "Sign in with Google" via Supabase Auth. Gets user into the app.
2. **Business Profile OAuth** — Separate consent flow. User clicks "Connect Business" → Google consent screen → grants `business.manage` scope → we store tokens → can now fetch reviews + post replies on their behalf.

These are DIFFERENT flows with DIFFERENT scopes. Don't confuse them.

## Coding Standards (Uncle Bob's Clean Code)
1. **Single Responsibility** — Each module has one reason to change
2. **Meaningful Names** — `syncReviewsForBusiness` not `sync`
3. **Small Functions** — Max 20 lines. Extract helpers into lib/
4. **Named Constants** — `FREE_TIER_BUSINESSES = 1`, `AUTO_REPLY_DELAY_MS = 5000`
5. **Error Handling** — Google API errors, token refresh failures, rate limits
6. **DRY** — Shared Google API client, shared Supabase queries, shared OpenAI module
7. **Type Safety** — Full TypeScript. Interface for every API response.
8. **Separation of Concerns** — Google API calls in lib/google-business.ts, AI in lib/openai.ts
9. **Security** — RLS on all tables. Validate all inputs. Auth on all endpoints.
10. **Graceful Degradation** — If Google API fails, show error, don't crash

## Environment Variables
See `.env.example`. ALL config externalized. Zero hardcoded values.
Env vars are accessed via `lib/env.ts` with validation (no `!` assertions).

## Database
Supabase with RLS. Tables: businesses, reviews, replies, subscriptions, user_settings.
All tables have RLS policies. The subscriptions table tracks Stripe billing state.

## Stripe Integration
- Checkout: `/api/stripe/checkout` creates Stripe Checkout sessions
- Portal: `/api/stripe/portal` creates Customer Portal sessions
- Webhooks: `/api/webhooks/stripe` handles checkout.completed, subscription.updated/deleted
- Feature gating: `lib/subscription.ts` — canAddBusiness(), canUseAutoReply()
- Tiers: free, starter ($29/mo), professional ($79/mo), enterprise ($199/mo)

## Key Decisions
- Two separate OAuth flows (login vs business consent)
- Cron job syncs reviews (daily on Vercel)
- Auto-reply: configurable per business (on/off), gated by subscription tier
- Tone config: presets + custom voice + example responses
- Stripe Checkout for billing (KISS)
- Rate limit retry with exponential backoff on Google API calls
- Error boundaries wrap dashboard content
