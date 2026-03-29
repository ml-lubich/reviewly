# Reviewly — Google Review Automation SaaS

## Overview
A SaaS platform where businesses can sign up, connect their Google Business Profile, and automatically reply to Google Reviews in their own tone/voice using AI.

## Core Features

### 1. Authentication & Onboarding
- Google OAuth login for business owners
- Connect Google Business Profile via Google Business Profile API
- Multi-location support (one account, many businesses)

### 2. Dashboard
- See all reviews across locations in one view
- Filter by rating (1-5 stars), responded/unresponded, date
- Review response status: pending, auto-replied, manually edited

### 3. Tone Configuration
- Business owner sets their "voice" / tone (friendly, professional, casual, etc.)
- Can provide example responses for AI to learn from
- Per-location tone settings
- Toggle auto-reply on/off per location

### 4. AI Auto-Reply Engine
- Automatically generates replies to new Google reviews
- Uses the business's configured tone
- Different strategies for positive (4-5 stars) vs negative (1-3 stars) reviews
- Owner can review/edit before publishing OR enable full auto-mode
- Queue system: new reviews → AI generates reply → owner approves → published

### 5. Analytics
- Response time metrics
- Review sentiment trends
- Reply rate percentage

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4o for reply generation
- **Auth**: Supabase Auth with Google OAuth
- **API**: Google Business Profile API (for reviews)
- **Deployment**: Vercel
- **Language**: TypeScript

## Database Schema (Supabase)

### businesses
- id (uuid, pk)
- owner_id (uuid, fk → auth.users)
- google_place_id (text)
- business_name (text)
- tone_description (text)
- example_responses (jsonb)
- auto_reply_enabled (boolean, default false)
- created_at (timestamptz)

### reviews
- id (uuid, pk)
- business_id (uuid, fk → businesses)
- google_review_id (text, unique)
- reviewer_name (text)
- rating (int)
- review_text (text)
- review_date (timestamptz)
- status (enum: pending, auto_replied, manually_replied, skipped)
- created_at (timestamptz)

### replies
- id (uuid, pk)
- review_id (uuid, fk → reviews)
- generated_text (text)
- final_text (text)
- status (enum: draft, approved, published)
- published_at (timestamptz)
- created_at (timestamptz)

## Pages / Routes
- `/` — Landing page (marketing)
- `/login` — Google OAuth login
- `/dashboard` — Main dashboard with review list
- `/dashboard/[businessId]` — Single business view
- `/dashboard/[businessId]/settings` — Tone config, auto-reply toggle
- `/dashboard/[businessId]/analytics` — Charts and metrics
- `/onboarding` — Connect Google Business Profile

## MVP Scope (Build This First)
1. Landing page with value prop
2. Google OAuth login via Supabase
3. Dashboard showing mock reviews (we can use mock data initially if Google API is complex)
4. Tone configuration page
5. AI reply generation (OpenAI)
6. Manual approve/edit/publish flow
7. Clean, modern UI with Tailwind + shadcn/ui

## Design Direction
- Clean, minimal, modern SaaS aesthetic
- Dark/light mode support
- Mobile responsive
- Similar vibe to: Linear, Vercel Dashboard, Supabase Dashboard
