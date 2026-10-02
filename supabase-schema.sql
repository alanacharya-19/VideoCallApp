-- Supabase schema for MeetNow
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- ─── Profiles ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  photo_url text,
  color_index integer not null default 0,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read all profiles (for search/discovery)
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── Friend Requests ───────────────────────────────────────────────────────

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "Users can read own requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Users can update requests"
  on public.friend_requests for update
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- ─── Call Records ─────────────────────────────────────────────────────────

create table if not exists public.call_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id text not null,
  peer_name text not null,
  peer_color_index integer not null default 0,
  direction text not null check (direction in ('outgoing', 'incoming')),
  outcome text not null check (outcome in ('completed', 'missed')),
  mode text not null check (mode in ('audio', 'video')),
  started_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

alter table public.call_records enable row level security;

create policy "Users can read own call history"
  on public.call_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own call records"
  on public.call_records for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own call records"
  on public.call_records for delete
  using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
