# Reviewly — Implementation Plan

## Iteration 1: Project Setup ✅
- [x] Next.js 14+ with App Router, TypeScript, Tailwind CSS
- [x] shadcn/ui configured with custom components (button, card, badge, input, textarea, select, switch)
- [x] Project structure: app/, components/, lib/, types/
- [x] .env.example with all needed env vars
- [x] Dependencies installed (Supabase, OpenAI, next-themes, lucide-react)

## Iteration 2: Landing Page
- [ ] Hero section with headline, subheadline, CTA
- [ ] Features section
- [ ] Pricing section
- [ ] Footer

## Iteration 3: Auth + Database
- [ ] Supabase client setup
- [ ] Database schema SQL
- [ ] Login page with Google OAuth
- [ ] Auth middleware for protected routes

## Iteration 4: Dashboard
- [ ] Main dashboard with review list and filters
- [ ] Business overview stats
- [ ] Review cards with status badges

## Iteration 5: Tone Settings + AI Replies
- [ ] Business settings page (tone config)
- [ ] API route for AI reply generation
- [ ] Review detail with generated reply
- [ ] Approve/edit/publish flow

## Iteration 6: Polish
- [ ] Dark/light mode toggle
- [ ] Mobile responsive
- [ ] Loading states and error handling
- [ ] README.md
