# Research Cycle — Tech Stack Improvements

**Date:** 2026-03-30 (America/Los_Angeles)
**Project:** reviewly
**Topic:** Tech stack improvements (Next.js + Supabase)

## What I researched

### 1) Next.js 16/16.2 updates relevant to Reviewly
- **Next.js 16 introduced Cache Components (`use cache`) + PPR-centric rendering model** (opt-in caching, request-time dynamic by default).
- **Next.js 16 renamed `middleware.ts` to `proxy.ts` directionally**, but docs emphasize migration handling and runtime boundary clarity.
- **Next.js 16.2 highlights**: major dev startup/render performance improvements, improved debugging, and broad Turbopack fixes.

Sources:
- https://nextjs.org/blog/next-16
- https://nextjs.org/blog/next-16-2

### 2) Supabase platform changes relevant to Reviewly
- **Log Drains on Pro** are available for forwarding Postgres/Auth/Storage/Functions/Realtime logs to tools like Datadog/Sentry/Loki/S3.
- **Edge Functions nested/recursive call rate-limit enforcement** was introduced to protect platform reliability.
- Ongoing observability improvements suggest stronger production monitoring patterns are now expected baseline.

Source:
- https://supabase.com/changelog

### 3) Codebase analysis using Claude Code
Claude Code was used to inspect the Reviewly repository and identify practical implementation gaps aligned with current Next.js/Supabase patterns.

Key findings from code inspection:
1. Auth boundary file naming/routing may be inconsistent with current Next conventions and execution expectations.
2. Dashboard data flows are still heavily client-fetch based and can be shifted toward Server Components + Suspense streaming.
3. Mutation-heavy flows can move from API route fetch boilerplate to Server Actions where appropriate.
4. Revalidation strategy is sparse; post-mutation cache invalidation can improve consistency/perf.
5. API input validation can be standardized with schema-based parsing (e.g., Zod).

## Recommended improvements (prioritized)

### P1 — Server-render dashboard data with Suspense boundaries
Move key dashboard reads from client `useEffect` fetch chains into async Server Components and stream slow blocks.
- Expected outcome: faster first useful paint, less loading-state churn, simpler client code.

### P1 — Add explicit invalidation/revalidation strategy
After write paths (sync, bulk reply, settings updates), call `revalidatePath`/tag strategy so dashboard state is coherent without manual refreshes.
- Expected outcome: consistent UI state after actions, fewer stale views.

### P2 — Introduce schema validation for API boundaries
Adopt Zod schemas for request payload parsing at route handlers/actions.
- Expected outcome: safer API contracts, fewer runtime edge-case failures.

### P2 — Incremental Server Actions adoption
Migrate selected mutation endpoints to Server Actions where app-router ergonomics fit.
- Expected outcome: lower API boilerplate, clearer co-location with UI + built-in cache integration.

### P3 — Observability hardening with Supabase Log Drains
Evaluate enabling Log Drains (Pro) and route key auth/db/function events to monitoring sink.
- Expected outcome: faster production debugging and trend visibility.

## GitHub issues created
- "Migrate dashboard data fetching to Server Components + Suspense"
- "Add revalidation strategy for review sync and bulk mutations"
- "Standardize API request validation with Zod schemas"
- "Evaluate Supabase Log Drains integration for production observability"

## Notes
- This cycle focused on **tech stack improvements** only.
- Next cycle should rotate to a different topic (competitive analysis / SEO & marketing / UX).