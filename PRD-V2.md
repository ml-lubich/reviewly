# Reviewly v2 — Production Upgrade PRD

## Goal
Take Reviewly from mock-data demo to production-ready SaaS that:
1. Runs on **Vercel** (Next.js frontend + API routes)
2. Uses **Supabase** for auth (Google OAuth) and Postgres database
3. Can also run as a **Docker container** on AWS (ECS/Fargate) with externalized config
4. Implements **Google OAuth consent flow** so customers authorize the bot to reply to their Google reviews
5. Actually connects to **Google Business Profile API** to fetch reviews and post replies

## Architecture

### Deployment Options
- **Primary**: Vercel (zero-config, auto-deploy from git)
- **Alternative**: Docker on AWS ECS/Fargate

### Externalized Configuration
ALL config via environment variables, NO hardcoded values:
- `DATABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (for Google Business Profile OAuth)
- `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`

### Docker
- Multi-stage Dockerfile (build + runtime)
- docker-compose.yml for local dev
- Health check endpoint at `/api/health`
- Graceful shutdown handling

## What Needs to Change

### 1. Replace ALL Mock Data with Real Supabase
- Remove mock-data.ts entirely
- Create real Supabase migrations for: businesses, reviews, replies, user_settings
- All dashboard pages fetch from Supabase
- Real-time subscriptions for new reviews (Supabase Realtime)

### 2. Google Business Profile Integration
- OAuth consent flow: user clicks "Connect Google Business" → redirected to Google → grants access to Business Profile API
- Store OAuth tokens (access_token, refresh_token) in Supabase securely
- Fetch reviews from Google Business Profile API v1
- Post AI-generated replies back via the API
- Token refresh handling
- Scopes needed: `https://www.googleapis.com/auth/business.manage`

### 3. Supabase Auth (Google OAuth for Login)
- This is SEPARATE from the Business Profile OAuth
- Login OAuth = "sign in with Google" (already partially done)
- Make sure auth callback, session management, and middleware work end-to-end
- Protected routes with proper redirects

### 4. Review Sync Worker
- Background job / cron that:
  - Fetches new reviews from Google for each connected business
  - Stores them in Supabase
  - If auto-reply enabled: generates AI reply + publishes
- Can run as: Vercel Cron, or a separate process in Docker

### 5. Docker Support
- `Dockerfile` — multi-stage, production-ready
- `docker-compose.yml` — app + local Supabase (for dev)
- `.dockerignore`
- `scripts/start.sh` — entrypoint with env validation
- Health check endpoint

### 6. API Routes (Real)
- `POST /api/reviews/sync` — trigger review sync for a business
- `POST /api/reviews/[id]/reply` — generate + optionally publish reply
- `GET /api/businesses` — list user's connected businesses
- `POST /api/businesses/connect` — initiate Google Business OAuth
- `GET /api/businesses/callback` — handle Google Business OAuth callback
- `GET /api/health` — health check

### 7. Database Migrations
Create proper Supabase migrations:
```sql
-- businesses table with google_tokens (encrypted)
-- reviews table linked to businesses
-- replies table linked to reviews
-- RLS policies for multi-tenant security
```

## Implementation Order (Ralph Loop)

ITERATION 1: Externalize all config + create Dockerfile + docker-compose + health endpoint. Commit.
ITERATION 2: Real Supabase schema — migrations for businesses, reviews, replies with RLS. Remove mock data. Commit.
ITERATION 3: Fix Supabase Google OAuth login end-to-end (sign-in, callback, session, middleware). Commit.
ITERATION 4: Google Business Profile OAuth consent — separate flow for connecting a business, store tokens. Commit.
ITERATION 5: Review fetching — API route + service to pull reviews from Google Business Profile API, store in Supabase. Commit.
ITERATION 6: AI reply generation + publishing — generate with OpenAI, publish via Google API. Auto-reply worker/cron. Commit.
ITERATION 7: Wire up all dashboard pages to real Supabase data (no more mock). Real-time updates. Commit.
ITERATION 8: Polish — error handling, loading states, README with deploy instructions for both Vercel and Docker. Commit.
