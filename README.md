# Reviewly

AI-powered Google Review management for businesses. Automatically respond to reviews in your brand's voice using GPT-4o.

## Features

- **AI Reply Generation** — Generate personalized, on-brand responses to every review
- **Auto-Reply Mode** — Automatically publish AI replies or review before publishing
- **Tone Configuration** — Set your brand voice with presets or custom descriptions
- **Multi-Location Support** — Manage reviews across all business locations
- **Analytics Dashboard** — Track response rates, sentiment trends, and reply times
- **Dark/Light Mode** — Full theme support with system detection

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (Postgres + Auth)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4o
- **Auth**: Supabase Auth with Google OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- An OpenAI API key

### Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd reviewly
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in your keys:

```bash
cp .env.example .env.local
```

4. Set up the database — run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

5. Configure Google OAuth in your Supabase project (Authentication > Providers > Google).

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── login/page.tsx                    # Google OAuth login
│   ├── dashboard/
│   │   ├── page.tsx                      # Main dashboard with reviews
│   │   ├── layout.tsx                    # Sidebar navigation
│   │   └── [businessId]/
│   │       ├── settings/page.tsx         # Tone & reply configuration
│   │       └── analytics/page.tsx        # Review analytics
│   └── api/
│       ├── auth/callback/route.ts        # OAuth callback
│       └── generate-reply/route.ts       # AI reply generation
├── components/
│   ├── ui/                               # shadcn/ui primitives
│   ├── theme-provider.tsx                # Dark/light mode
│   ├── theme-toggle.tsx                  # Theme toggle button
│   └── star-rating.tsx                   # Star rating display
├── lib/
│   ├── supabase.ts                       # Browser Supabase client
│   ├── supabase-server.ts                # Server Supabase client
│   ├── mock-data.ts                      # Demo data
│   └── utils.ts                          # Utility functions
└── middleware.ts                          # Auth route protection
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `OPENAI_API_KEY` | Your OpenAI API key |

## License

MIT
