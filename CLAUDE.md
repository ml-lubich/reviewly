# CLAUDE.md — Reviewly

## Project Overview
Reviewly is a SaaS where businesses connect their Google Business Profile and automatically reply to Google Reviews using AI, in their own configured tone/voice.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Auth**: Supabase Google OAuth (login) + Google Business Profile OAuth (consent)
- **AI**: OpenAI GPT-4o (reply generation)
- **Google API**: Business Profile API v1 (fetch reviews + post replies)
- **Payments**: Stripe (checkout + customer portal + webhooks)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Architecture
```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Supabase auth callback + signout
│   │   ├── google/        # Google Business Profile OAuth (connect + callback)
│   │   ├── businesses/    # Business CRUD
│   │   ├── reviews/       # Review sync + reply
│   │   ├── webhooks/      # Stripe webhooks
│   │   ├── cron/          # Review sync cron
│   │   ├── health/        # Health check
│   │   └── generate-reply/ # AI reply generation
│   ├── dashboard/         # Business dashboard + settings + analytics
│   ├── login/             # Login page
│   └── onboarding/        # Connect Google Business Profile
├── components/
│   └── ui/
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   ├── google.ts          # Google Business Profile API client
│   ├── openai.ts          # Reply generation
│   └── utils.ts
└── types/
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
6. **DRY** — Shared Google API client, shared Supabase queries
7. **Type Safety** — Full TypeScript. Interface for every Google API response.
8. **Separation of Concerns** — Google API calls in lib/google.ts, not in route handlers
9. **Security** — Encrypt stored OAuth tokens. RLS on all tables. Validate all inputs.
10. **Graceful Degradation** — If Google API fails, show error, don't crash

## Environment Variables
See `.env.example`. ALL config externalized. Zero hardcoded values.

## Database
Supabase with RLS. Tables: businesses, reviews, replies, google_tokens, user_settings.
google_tokens stores encrypted access/refresh tokens per business.

## Key Decisions
- Two separate OAuth flows (login vs business consent)
- Cron job syncs reviews (daily on free Vercel, configurable)
- Auto-reply: configurable per business (on/off)
- Tone config: presets + custom voice + example responses
- Stripe Checkout for billing (KISS)
