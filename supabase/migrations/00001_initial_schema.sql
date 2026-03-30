-- Reviewly Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enum types
create type review_status as enum ('pending', 'auto_replied', 'manually_replied', 'skipped');
create type reply_status as enum ('draft', 'approved', 'published');
create type subscription_tier as enum ('free', 'starter', 'professional', 'enterprise');

-- Businesses table
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  google_place_id text,
  google_account_id text,
  google_location_id text,
  business_name text not null,
  tone_description text default 'friendly and professional',
  example_responses jsonb default '[]'::jsonb,
  negative_review_strategy text default 'apologize_resolve',
  auto_reply_enabled boolean default false,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reviews table
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  google_review_id text unique,
  reviewer_name text not null,
  reviewer_photo_url text,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  review_date timestamptz default now(),
  status review_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Replies table
create table replies (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade not null,
  generated_text text not null,
  final_text text,
  status reply_status default 'draft',
  published_at timestamptz,
  created_at timestamptz default now()
);

-- User settings table
create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  default_tone text default 'friendly and professional',
  notifications_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions table (Stripe integration)
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier subscription_tier default 'free' not null,
  status text default 'active' not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table businesses enable row level security;
alter table reviews enable row level security;
alter table replies enable row level security;
alter table user_settings enable row level security;
alter table subscriptions enable row level security;

-- Businesses: owners can CRUD their own businesses
create policy "Users can view their own businesses"
  on businesses for select using (auth.uid() = owner_id);

create policy "Users can create businesses"
  on businesses for insert with check (auth.uid() = owner_id);

create policy "Users can update their own businesses"
  on businesses for update using (auth.uid() = owner_id);

create policy "Users can delete their own businesses"
  on businesses for delete using (auth.uid() = owner_id);

-- Reviews: visible to business owners
create policy "Users can view reviews for their businesses"
  on reviews for select using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Users can insert reviews for their businesses"
  on reviews for insert with check (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Users can update reviews for their businesses"
  on reviews for update using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );

-- Replies: visible to business owners via review chain
create policy "Users can view replies for their reviews"
  on replies for select using (
    review_id in (
      select r.id from reviews r
      join businesses b on r.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

create policy "Users can insert replies for their reviews"
  on replies for insert with check (
    review_id in (
      select r.id from reviews r
      join businesses b on r.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

create policy "Users can update replies for their reviews"
  on replies for update using (
    review_id in (
      select r.id from reviews r
      join businesses b on r.business_id = b.id
      where b.owner_id = auth.uid()
    )
  );

-- User settings: users can manage their own
create policy "Users can view their own settings"
  on user_settings for select using (auth.uid() = user_id);

create policy "Users can create their own settings"
  on user_settings for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update using (auth.uid() = user_id);

-- Subscriptions: users can view their own, service role manages writes
create policy "Users can view their own subscription"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can create their own subscription"
  on subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update their own subscription"
  on subscriptions for update using (auth.uid() = user_id);

-- Indexes for performance
create index idx_businesses_owner on businesses(owner_id);
create index idx_reviews_business on reviews(business_id);
create index idx_reviews_status on reviews(status);
create index idx_reviews_google_id on reviews(google_review_id);
create index idx_replies_review on replies(review_id);
create index idx_user_settings_user on user_settings(user_id);
create index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger businesses_updated_at
  before update on businesses
  for each row execute function update_updated_at();

create trigger reviews_updated_at
  before update on reviews
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on user_settings
  for each row execute function update_updated_at();

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();

-- Enable realtime for reviews
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table replies;
