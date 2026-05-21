-- Back Office Agent — Supabase schema
-- Spustit jednou v Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ──────────────────────────────────────────────────────────────────────
-- Conversations + messages (chat history)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists conversations_user_recent_idx
  on conversations (user_id, last_message_at desc);

create table if not exists messages (
  id text primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

-- ──────────────────────────────────────────────────────────────────────
-- Calendar events (per user)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists calendar_events (
  id text primary key,
  user_id text not null,
  title text not null,
  date date not null,
  start_time text not null,
  end_time text,
  duration_minutes int,
  attendees jsonb default '[]'::jsonb,
  location text,
  notes text,
  source text not null default 'agent' check (source in ('seed','agent')),
  created_at timestamptz default now()
);
create index if not exists calendar_user_date_idx on calendar_events (user_id, date);

-- ──────────────────────────────────────────────────────────────────────
-- Briefings + sim state (Praha-Holešovice morning monitor)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists briefings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  date date not null,
  district text not null,
  listings jsonb not null default '[]'::jsonb,
  generated_by text not null default 'manual' check (generated_by in ('manual','cron','seed')),
  created_at timestamptz default now(),
  unique (user_id, date, district)
);
create index if not exists briefings_user_district_idx
  on briefings (user_id, district, date desc);

create table if not exists sim_state (
  user_id text primary key,
  district text not null default 'Praha-Holešovice',
  last_sim_date date not null default '2026-05-17',
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- RLS — pro demo otevřená pravidla (filtr na user_id na app level
-- pomocí service-role key v server route handleru)
-- ──────────────────────────────────────────────────────────────────────
alter table conversations enable row level security;
alter table messages enable row level security;
alter table calendar_events enable row level security;
alter table briefings enable row level security;
alter table sim_state enable row level security;

-- Drop and recreate (idempotent)
drop policy if exists "demo_open" on conversations;
drop policy if exists "demo_open" on messages;
drop policy if exists "demo_open" on calendar_events;
drop policy if exists "demo_open" on briefings;
drop policy if exists "demo_open" on sim_state;

create policy "demo_open" on conversations for all using (true) with check (true);
create policy "demo_open" on messages for all using (true) with check (true);
create policy "demo_open" on calendar_events for all using (true) with check (true);
create policy "demo_open" on briefings for all using (true) with check (true);
create policy "demo_open" on sim_state for all using (true) with check (true);
