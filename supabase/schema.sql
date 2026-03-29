-- Reviewly Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Businesses table
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  google_place_id text,
  business_name text not null,
  tone_description text default 'friendly and professional',
  example_responses jsonb default '[]'::jsonb,
  auto_reply_enabled boolean default false,
  created_at timestamptz default now()
);

-- Reviews table
create type review_status as enum ('pending', 'auto_replied', 'manually_replied', 'skipped');

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade not null,
  google_review_id text unique,
  reviewer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  review_date timestamptz default now(),
  status review_status default 'pending',
  created_at timestamptz default now()
);

-- Replies table
create type reply_status as enum ('draft', 'approved', 'published');

create table replies (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid references reviews(id) on delete cascade not null,
  generated_text text not null,
  final_text text,
  status reply_status default 'draft',
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security
alter table businesses enable row level security;
alter table reviews enable row level security;
alter table replies enable row level security;

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

-- Indexes for performance
create index idx_businesses_owner on businesses(owner_id);
create index idx_reviews_business on reviews(business_id);
create index idx_reviews_status on reviews(status);
create index idx_replies_review on replies(review_id);
