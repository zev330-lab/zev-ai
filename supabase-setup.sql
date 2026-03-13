-- ZEV.AI — Supabase Table Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Contacts table (from /contact page)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  status text default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  notes text
);

-- Discoveries table (from /discover intake form)
create table if not exists discoveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  company text,
  role text,
  business_overview text,
  team_size text,
  pain_points text,
  repetitive_work text,
  ai_experience text,
  ai_tools_detail text,
  magic_wand text,
  success_vision text,
  anything_else text,
  status text default 'new' check (status in ('new', 'reviewed', 'meeting_scheduled', 'proposal_sent', 'engaged', 'archived')),
  notes text
);

-- Enable Row Level Security
alter table contacts enable row level security;
alter table discoveries enable row level security;

-- Allow anonymous inserts (public form submissions)
create policy "Allow anonymous inserts" on contacts
  for insert to anon with check (true);

create policy "Allow anonymous inserts" on discoveries
  for insert to anon with check (true);

-- Allow service role full access (admin dashboard)
create policy "Service role full access" on contacts
  for all to service_role using (true) with check (true);

create policy "Service role full access" on discoveries
  for all to service_role using (true) with check (true);

-- Indexes for common queries
create index if not exists idx_contacts_status on contacts (status);
create index if not exists idx_contacts_created on contacts (created_at desc);
create index if not exists idx_discoveries_status on discoveries (status);
create index if not exists idx_discoveries_created on discoveries (created_at desc);
