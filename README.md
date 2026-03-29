# Reviewly

AI-powered Google Review management for businesses. Automatically respond to reviews in your brand's voice using GPT-4o.

## Features

- **Google Business Profile Integration** — Connect your Google Business and sync reviews automatically
- **AI Reply Generation** — Generate personalized, on-brand responses to every review
- **Auto-Reply Worker** — Cron job that syncs reviews and auto-publishes AI replies
- **Tone Configuration** — Set your brand voice with presets or custom descriptions
- **Multi-Location Support** — Manage reviews across all business locations
- **Real-time Updates** — New reviews appear instantly via Supabase Realtime
- **Analytics Dashboard** — Track response rates, sentiment trends, and rating distribution
- **Dark/Light Mode** — Full theme support with system detection

## Tech Stack

- **Framework**: Next.js 16 (App Router, standalone output)
- **Language**: TypeScript
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Styling**: Tailwind CSS 4
- **AI**: OpenAI GPT-4o
- **Auth**: Supabase Auth (Google OAuth for login) + Google Business Profile OAuth
- **Deployment**: Vercel (primary) or Docker on AWS ECS/Fargate

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- An OpenAI API key
- Google Cloud project with Business Profile API enabled

### Setup

1. Clone and install:

```bash
git clone <repo-url>
cd reviewly
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

3. Set up the database — run `supabase/schema.sql` in your Supabase SQL Editor.

4. Configure Supabase Auth:
   - Go to Authentication > Providers > Google
   - Add your Google OAuth Client ID and Secret

5. Configure Google Business Profile API:
   - Enable the "My Business Account Management API" and "My Business Business Information API" in Google Cloud Console
   - Create OAuth 2.0 credentials with redirect URI: `{APP_URL}/api/google/callback`
   - Add scope: `https://www.googleapis.com/auth/business.manage`

6. Start development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push your repo to GitHub
2. Import in Vercel
3. Add all environment variables from `.env.example`
4. Deploy — Vercel Cron will run review sync automatically

## Deploy with Docker

Build and run:

```bash
docker compose up --build
```

Or build the image directly:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --build-arg NEXT_PUBLIC_APP_URL=... \
  -t reviewly .

docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e OPENAI_API_KEY=... \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  reviewly
```

For AWS ECS, push to ECR and create a task definition with the environment variables.

Health check: `GET /api/health`

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/businesses` | List connected businesses |
| GET | `/api/google/connect` | Initiate Google Business OAuth |
| GET | `/api/google/callback` | Google Business OAuth callback |
| POST | `/api/reviews/sync` | Sync reviews from Google |
| POST | `/api/reviews/[id]/reply` | Generate, save, or publish a reply |
| POST | `/api/generate-reply` | Generate AI reply (legacy) |
| GET | `/api/cron/sync-reviews` | Cron: sync all businesses + auto-reply |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. https://reviewly.app) |
| `CRON_SECRET` | No | Secret for securing cron endpoint |
| `NODE_ENV` | No | `development` or `production` |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                            # Landing page
│   ├── login/page.tsx                      # Google OAuth login
│   ├── dashboard/
│   │   ├── page.tsx                        # Main dashboard with reviews
│   │   ├── layout.tsx                      # Sidebar navigation
│   │   └── [businessId]/
│   │       ├── settings/page.tsx           # Tone & reply configuration
│   │       └── analytics/page.tsx          # Review analytics
│   └── api/
│       ├── auth/{callback,signout}/        # Supabase auth
│       ├── google/{connect,callback}/      # Google Business OAuth
│       ├── businesses/                     # Business listing
│       ├── reviews/{sync,[id]/reply}/      # Review sync & replies
│       ├── cron/sync-reviews/              # Auto-sync worker
│       ├── generate-reply/                 # AI generation
│       └── health/                         # Health check
├── components/ui/                          # UI primitives
├── lib/
│   ├── supabase.ts                         # Browser client
│   ├── supabase-server.ts                  # Server client
│   ├── supabase-admin.ts                   # Service role client
│   ├── google-oauth.ts                     # Google OAuth helpers
│   ├── google-business.ts                  # Google Business Profile API
│   ├── data.ts                             # Data access layer
│   ├── types.ts                            # TypeScript interfaces
│   └── utils.ts                            # Utilities
├── middleware.ts                            # Auth route protection
Dockerfile                                  # Multi-stage Docker build
docker-compose.yml                          # Container orchestration
scripts/start.sh                            # Docker entrypoint
supabase/schema.sql                         # Database schema + RLS
vercel.json                                 # Vercel cron config
```

## License

MIT
