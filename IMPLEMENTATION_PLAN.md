# Reviewly v2 — Implementation Plan

## Phase 1 (v1 — Complete)

### Iteration 1: Project Setup
- [x] Next.js with App Router, TypeScript, Tailwind CSS
- [x] UI components (button, card, badge, input, textarea, select, switch)
- [x] Project structure and dependencies

### Iteration 2: Landing Page
- [x] Hero, features, how it works, pricing, CTA sections

### Iteration 3: Auth + Database
- [x] Supabase browser + server client setup
- [x] Database schema SQL with RLS policies
- [x] Login page with Google OAuth
- [x] Auth middleware for protected routes

### Iteration 4: Dashboard
- [x] Review list with filters, stat cards, AI reply generation
- [x] Sidebar layout with business selector

### Iteration 5: Tone Settings + AI Replies
- [x] Settings page with tone presets and example responses
- [x] API route for AI reply generation (OpenAI GPT-4o)
- [x] Analytics page with charts

### Iteration 6: Polish (v1)
- [x] Dark/light mode, mobile responsive
- [x] Loading states, error handling, README

---

## Phase 2 (v2 — Production Upgrade)

### Iteration 1: Docker + Config Externalization
- [x] Multi-stage Dockerfile (deps → build → runtime)
- [x] docker-compose.yml for containerized deployment
- [x] /api/health endpoint with container health check
- [x] scripts/start.sh with env validation and graceful shutdown
- [x] All config externalized to environment variables
- [x] next.config.ts standalone output mode

### Iteration 2: Real Supabase Schema + Remove Mock Data
- [x] Updated schema with Google OAuth token fields, user_settings table
- [x] Updated_at triggers, realtime subscriptions
- [x] TypeScript interfaces in lib/types.ts
- [x] Data access layer in lib/data.ts
- [x] Service role client in lib/supabase-admin.ts
- [x] Removed mock-data.ts entirely
- [x] Dashboard pages fetch from Supabase

### Iteration 3: Supabase Google OAuth Login
- [x] Sign-out via /api/auth/signout
- [x] Error display on login with Suspense boundary
- [x] Session-aware header and sidebar
- [x] Removed demo dashboard button

### Iteration 4: Google Business Profile OAuth
- [x] Google OAuth helper (auth URL, token exchange, refresh)
- [x] /api/google/connect initiates consent flow
- [x] /api/google/callback handles token exchange + creates businesses
- [x] /api/businesses lists connected businesses
- [x] Token refresh with expiry buffer

### Iteration 5: Review Fetching
- [x] Google Business Profile API integration
- [x] /api/reviews/sync endpoint for on-demand sync
- [x] Upsert logic for reviews
- [x] Imports existing Google replies

### Iteration 6: AI Reply + Auto-Reply Worker
- [x] /api/reviews/[id]/reply with generate/save/publish actions
- [x] Negative review strategy support in AI prompts
- [x] Posts replies to Google Business Profile API
- [x] /api/cron/sync-reviews auto-reply worker
- [x] Vercel cron config

### Iteration 7: Wire Dashboard to Real Data
- [x] Reply actions call real API routes
- [x] Sync button on dashboard
- [x] Realtime subscription for new reviews
- [x] Analytics from real Supabase data
- [x] Settings save to Supabase

### Iteration 8: Polish + Deploy Docs
- [x] README with Vercel + Docker deploy instructions
- [x] API route documentation
- [x] Environment variable reference
- [x] Updated project structure

---

## Phase 3 (v3 — Production Hardening)

### Iteration 1: Audit + Clean Code Review
- [x] Full codebase audit — BUGS.md written
- [x] Extract lib/openai.ts (DRY: 3 duplicate AI functions → 1)
- [x] Extract lib/env.ts (validated env var access, no more ! assertions)
- [x] Extract lib/constants.ts (named constants for statuses, thresholds)
- [x] Fix CRITICAL: /api/generate-reply now requires authentication
- [x] Refactor auth routes to use createServerSupabaseClient
- [x] Refactor reply route into SRP action handlers
- [x] Refactor cron route into small focused functions
- [x] Refactor Google callback into extracted helpers

### Iteration 2: Fix Supabase
- [x] Add subscriptions table with Stripe fields + RLS policies
- [x] Add subscription_tier enum
- [x] Add Subscription TypeScript interface
- [x] Extract calculateBusinessStats as reusable function

### Iteration 3: Fix Both Auth Flows
- [x] Signout uses HTTP 303 for POST-to-GET redirect
- [x] Google connect uses env helpers

### Iteration 4: Fix Dashboard Flows
- [x] Fix all empty catch blocks — errors logged and shown to users
- [x] Extract ReplyDisplay component (SRP)
- [x] Add error states to sync, settings, analytics, reply actions
- [x] Use shared calculateBusinessStats (DRY)

### Iteration 5: Fix Google Business API
- [x] Add rate limit retry with exponential backoff (Retry-After header)
- [x] Applied to both review fetching and reply posting

### Iteration 6: Stripe Integration
- [x] Install stripe package
- [x] lib/stripe.ts — singleton client, price IDs, tier limits
- [x] lib/subscription.ts — feature gating (canAddBusiness, canUseAutoReply)
- [x] /api/webhooks/stripe — checkout.completed, subscription.updated/deleted
- [x] /api/stripe/checkout — Stripe Checkout session creation
- [x] /api/stripe/portal — Stripe Customer Portal session

### Iteration 7: Final Hardening
- [x] ErrorBoundary component with retry
- [x] Global error.tsx and not-found.tsx pages
- [x] Health check validates all env vars, returns 503 if degraded
- [x] Dashboard wrapped in ErrorBoundary

### Iteration 8: Build + Verify
- [x] npm run build passes clean (zero errors, zero warnings)
- [x] Migrate middleware.ts → proxy.ts (Next.js 16 convention)
- [x] Updated CLAUDE.md, IMPLEMENTATION_PLAN.md
