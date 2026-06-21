-- ============================================================================
-- Gamly platform schema
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  coins bigint not null default 500,
  status text not null default 'offline' check (status in ('online', 'offline', 'in_game')),
  last_seen timestamptz not null default now(),
  equipped_theme text not null default 'default',
  equipped_avatar_frame text not null default 'default',
  equipped_title text,
  daily_streak int not null default 0,
  last_daily_claim_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_username_idx on public.profiles using gin (username gin_trgm_ops);

alter table public.profiles enable row level security;

create policy "profiles are viewable by all authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- coin_transactions
-- ----------------------------------------------------------------------------
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null,
  balance_after bigint not null,
  type text not null check (type in ('match_win', 'match_loss', 'daily_reward', 'achievement', 'shop_purchase', 'admin_adjustment')),
  description text,
  created_at timestamptz not null default now()
);

create index coin_transactions_user_id_idx on public.coin_transactions(user_id, created_at desc);

alter table public.coin_transactions enable row level security;

create policy "users can view their own transactions"
  on public.coin_transactions for select
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- friendships
-- ----------------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_friend check (requester_id <> recipient_id),
  constraint unique_pair unique (requester_id, recipient_id)
);

create index friendships_recipient_idx on public.friendships(recipient_id, status);
create index friendships_requester_idx on public.friendships(requester_id, status);

alter table public.friendships enable row level security;

create policy "users can view their own friendships"
  on public.friendships for select
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "users can create friend requests"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid());

create policy "users can update friendships they are part of"
  on public.friendships for update
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "users can delete friendships they are part of"
  on public.friendships for delete
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

-- ----------------------------------------------------------------------------
-- achievements
-- ----------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null default 'trophy',
  coin_reward bigint not null default 0
);

alter table public.achievements enable row level security;

create policy "achievements are viewable by all"
  on public.achievements for select
  to authenticated
  using (true);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "users can view their own achievements"
  on public.user_achievements for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- parties
-- ----------------------------------------------------------------------------
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  game text not null default 'wordle_rush',
  status text not null default 'lobby' check (status in ('lobby', 'countdown', 'in_progress', 'completed', 'cancelled')),
  duration_seconds int not null default 120 check (duration_seconds in (120, 300, 600)),
  wager_coins bigint not null default 0 check (wager_coins >= 0),
  match_id uuid,
  created_at timestamptz not null default now()
);

alter table public.parties enable row level security;

create table public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

alter table public.party_members enable row level security;

create policy "party members can view their party"
  on public.parties for select
  to authenticated
  using (
    host_id = auth.uid()
    or id in (select party_id from public.party_members where user_id = auth.uid())
  );

create policy "users can create parties"
  on public.parties for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "host can update their party"
  on public.parties for update
  to authenticated
  using (host_id = auth.uid());

create policy "party members can view membership"
  on public.party_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or party_id in (select id from public.parties where host_id = auth.uid())
    or party_id in (select party_id from public.party_members where user_id = auth.uid())
  );

create policy "users can join parties"
  on public.party_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update their own readiness"
  on public.party_members for update
  to authenticated
  using (user_id = auth.uid());

create policy "users can leave parties"
  on public.party_members for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- matches
-- ----------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references public.parties(id) on delete set null,
  game text not null default 'wordle_rush',
  duration_seconds int not null,
  wager_coins bigint not null default 0,
  seed text not null default encode(gen_random_bytes(8), 'hex'),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  winner_id uuid references public.profiles(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.matches enable row level security;

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null default 0,
  coins_delta bigint not null default 0,
  primary key (match_id, user_id)
);

alter table public.match_players enable row level security;

create policy "match participants can view match"
  on public.matches for select
  to authenticated
  using (id in (select match_id from public.match_players where user_id = auth.uid()));

create policy "match participants can view match_players"
  on public.match_players for select
  to authenticated
  using (match_id in (select match_id from public.match_players where user_id = auth.uid()));

create policy "match participants can update their own score"
  on public.match_players for update
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- shop_items + inventory
-- ----------------------------------------------------------------------------
create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  type text not null check (type in ('theme', 'avatar_frame', 'title')),
  price bigint not null,
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  asset_ref text not null
);

alter table public.shop_items enable row level security;

create policy "shop items are viewable by all"
  on public.shop_items for select
  to authenticated
  using (true);

create table public.user_inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.user_inventory enable row level security;

create policy "users can view their own inventory"
  on public.user_inventory for select
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- realtime publication
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.parties;
alter publication supabase_realtime add table public.party_members;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_players;
