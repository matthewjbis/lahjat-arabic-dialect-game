-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- One row per user, created automatically on sign-up via trigger below.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles: public read"
  on public.profiles for select using (true);

create policy "profiles: own write"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── Game sessions ─────────────────────────────────────────────────────────────
-- One row per completed game. Stores the final score and clip count.
create table if not exists public.game_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  mode        text not null default 'standard',
  total_score int  not null,
  max_score   int  not null,
  clip_count  int  not null,
  played_at   timestamptz default now()
);

alter table public.game_sessions enable row level security;

create policy "game_sessions: own read"
  on public.game_sessions for select using (auth.uid() = user_id);

create policy "game_sessions: own insert"
  on public.game_sessions for insert with check (auth.uid() = user_id);


-- ── Link submissions to users (optional user_id) ──────────────────────────────
alter table public.submissions
  add column if not exists user_id uuid references auth.users (id) on delete set null;


-- ── Clip reports ──────────────────────────────────────────────────────────────
-- Per-clip "Report a problem" submissions from the game's ScorePanel. Anyone
-- (signed in or anonymous) may insert; reads are admin-only via the service role.
create table if not exists public.clip_reports (
  id         uuid primary key default gen_random_uuid(),
  clip_id    text not null,
  reason     text not null check (reason in ('wrong_dialect', 'wrong_city', 'poor_quality', 'other')),
  note       text,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

alter table public.clip_reports enable row level security;

create policy "clip_reports: anyone can insert"
  on public.clip_reports for insert with check (true);


-- ── General feedback ──────────────────────────────────────────────────────────
-- Free-text suggestions from the summary screen. Anyone may insert; reads are
-- admin-only via the service role.
create table if not exists public.general_feedback (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

alter table public.general_feedback enable row level security;

create policy "general_feedback: anyone can insert"
  on public.general_feedback for insert with check (true);
