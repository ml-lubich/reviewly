# Reviewly — Implementation Plan

## Iteration 1: Project Setup ✅
- [x] Next.js 14+ with App Router, TypeScript, Tailwind CSS
- [x] shadcn/ui configured with custom components (button, card, badge, input, textarea, select, switch)
- [x] Project structure: app/, components/, lib/, types/
- [x] .env.example with all needed env vars
- [x] Dependencies installed (Supabase, OpenAI, next-themes, lucide-react)

## Iteration 2: Landing Page ✅
- [x] Hero section with headline, subheadline, CTA, mock dashboard preview
- [x] Features section (6 cards with icons)
- [x] How it works section (4 steps)
- [x] Pricing section (3 tiers)
- [x] CTA section and footer

## Iteration 3: Auth + Database ✅
- [x] Supabase browser + server client setup
- [x] Database schema SQL with RLS policies
- [x] Login page with Google OAuth
- [x] Auth middleware for protected routes

## Iteration 4: Dashboard ✅
- [x] Main dashboard with review list and filters (status + rating)
- [x] Business overview stats (4 stat cards)
- [x] Review cards with star ratings, status badges, reply management
- [x] AI reply generation + manual reply writing
- [x] Sidebar layout with business selector and mobile nav

## Iteration 5: Tone Settings + AI Replies ✅
- [x] Business settings page (tone presets, custom voice, example responses, negative review strategy)
- [x] API route for AI reply generation (OpenAI GPT-4o + fallback)
- [x] Review detail with generated reply inline
- [x] Approve/edit/publish flow in dashboard
- [x] Analytics page with charts and metrics

## Iteration 6: Polish ✅
- [x] Dark/light mode toggle (system detection + manual toggle)
- [x] Mobile responsive (sidebar hamburger menu, responsive grids)
- [x] Loading states (spinner on AI generation, save feedback)
- [x] Error handling (API fallbacks, empty states, auth redirects)
- [x] README.md with setup instructions
