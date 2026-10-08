-- MeetNow Production Schema v2
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── Profiles ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  username text unique default '',
  bio text default '',
  photo_url text,
  color_index integer not null default 0,
  is_online boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_is_online on public.profiles(is_online);

alter table public.profiles enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

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

create index if not exists idx_friend_requests_from on public.friend_requests(from_user_id);
create index if not exists idx_friend_requests_to on public.friend_requests(to_user_id);
create index if not exists idx_friend_requests_status on public.friend_requests(status);

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

-- ─── Blocks ────────────────────────────────────────────────────────────────

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_user_id)
);

create index if not exists idx_blocks_user on public.blocks(user_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_user_id);

alter table public.blocks enable row level security;

create policy "Users can read own blocks"
  on public.blocks for select using (auth.uid() = user_id);

create policy "Users can insert own blocks"
  on public.blocks for insert with check (auth.uid() = user_id);

create policy "Users can delete own blocks"
  on public.blocks for delete using (auth.uid() = user_id);

-- ─── Calls ─────────────────────────────────────────────────────────────────

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  channel_name text not null,
  call_type text not null check (call_type in ('audio', 'video')),
  status text not null default 'initiating' check (status in ('initiating', 'ringing', 'accepted', 'rejected', 'cancelled', 'missed', 'ended', 'failed')),
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  duration integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_calls_caller on public.calls(caller_id);
create index if not exists idx_calls_receiver on public.calls(receiver_id);
create index if not exists idx_calls_status on public.calls(status);
create index if not exists idx_calls_created_at on public.calls(created_at);

alter table public.calls enable row level security;

create policy "Users can read own calls"
  on public.calls for select
  using (auth.uid() = caller_id or auth.uid() = receiver_id);

create policy "Users can insert own calls"
  on public.calls for insert with check (auth.uid() = caller_id);

create policy "Users can update own calls"
  on public.calls for update
  using (auth.uid() = caller_id or auth.uid() = receiver_id);

-- ─── Call Events ───────────────────────────────────────────────────────────

create table if not exists public.call_events (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('incoming', 'accepted', 'rejected', 'ended', 'cancelled')),
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_call_events_call on public.call_events(call_id);
create index if not exists idx_call_events_user on public.call_events(user_id);

alter table public.call_events enable row level security;

create policy "Users can read own events"
  on public.call_events for select using (auth.uid() = user_id);

create policy "Users can insert own events"
  on public.call_events for insert with check (auth.uid() = user_id);

-- ─── Call Records (history) ────────────────────────────────────────────────

create table if not exists public.call_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id text not null,
  peer_name text not null,
  peer_color_index integer not null default 0,
  peer_photo_url text,
  direction text not null check (direction in ('outgoing', 'incoming')),
  outcome text not null check (outcome in ('completed', 'missed')),
  mode text not null check (mode in ('audio', 'video')),
  started_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

create index if not exists idx_call_records_user on public.call_records(user_id);
create index if not exists idx_call_records_started on public.call_records(started_at);

alter table public.call_records enable row level security;

create policy "Users can read own call history"
  on public.call_records for select using (auth.uid() = user_id);

create policy "Users can insert own call records"
  on public.call_records for insert with check (auth.uid() = user_id);

create policy "Users can delete own call records"
  on public.call_records for delete using (auth.uid() = user_id);

-- ─── User Settings ─────────────────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notifications_enabled boolean not null default true,
  sounds_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  audio_quality text not null default 'standard' check (audio_quality in ('standard', 'hd')),
  video_quality text not null default 'standard' check (video_quality in ('standard', 'hd')),
  speaker_default boolean not null default false,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings for select using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, username, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
    ''
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Realtime configuration ───────────────────────────────────────────────

alter publication supabase_realtime add table public.call_events;
alter publication supabase_realtime add table public.calls;
