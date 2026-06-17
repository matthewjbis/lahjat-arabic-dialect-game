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
  mode        text not null default 'classic',
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
