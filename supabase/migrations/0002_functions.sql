-- ============================================================================
-- Server-side functions (security definer) — all coin/state mutations must
-- go through these so clients can never directly mutate balances or scores.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- internal helper: adjust a user's coin balance and log the transaction
-- ----------------------------------------------------------------------------
create or replace function public._adjust_coins(
  p_user_id uuid,
  p_amount bigint,
  p_type text,
  p_description text
) returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_new_balance bigint;
begin
  update public.profiles
  set coins = coins + p_amount
  where id = p_user_id
  returning coins into v_new_balance;

  if v_new_balance < 0 then
    raise exception 'insufficient coins';
  end if;

  insert into public.coin_transactions (user_id, amount, balance_after, type, description)
  values (p_user_id, p_amount, v_new_balance, p_type, p_description);

  return v_new_balance;
end;
$$;

-- ----------------------------------------------------------------------------
-- claim_daily_reward
-- ----------------------------------------------------------------------------
create or replace function public.claim_daily_reward()
returns table (coins_awarded bigint, new_streak int, new_balance bigint)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last timestamptz;
  v_streak int;
  v_reward bigint;
  v_balance bigint;
begin
  select last_daily_claim_at, daily_streak into v_last, v_streak
  from public.profiles where id = v_user_id for update;

  if v_last is not null and v_last::date = now()::date then
    raise exception 'daily reward already claimed today';
  end if;

  if v_last is not null and v_last::date = (now() - interval '1 day')::date then
    v_streak := least(v_streak + 1, 7);
  else
    v_streak := 1;
  end if;

  v_reward := 50 + (v_streak - 1) * 25;

  update public.profiles
  set daily_streak = v_streak, last_daily_claim_at = now()
  where id = v_user_id;

  v_balance := public._adjust_coins(v_user_id, v_reward, 'daily_reward', 'Daily login reward (streak ' || v_streak || ')');

  return query select v_reward, v_streak, v_balance;
end;
$$;

-- ----------------------------------------------------------------------------
-- unlock_achievement
-- ----------------------------------------------------------------------------
create or replace function public.unlock_achievement(p_code text)
returns table (already_unlocked boolean, coins_awarded bigint)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_achievement_id uuid;
  v_reward bigint;
begin
  select id, coin_reward into v_achievement_id, v_reward
  from public.achievements where code = p_code;

  if v_achievement_id is null then
    raise exception 'unknown achievement code: %', p_code;
  end if;

  if exists (select 1 from public.user_achievements where user_id = v_user_id and achievement_id = v_achievement_id) then
    return query select true, 0::bigint;
    return;
  end if;

  insert into public.user_achievements (user_id, achievement_id) values (v_user_id, v_achievement_id);

  if v_reward > 0 then
    perform public._adjust_coins(v_user_id, v_reward, 'achievement', 'Achievement unlocked: ' || p_code);
  end if;

  return query select false, v_reward;
end;
$$;

-- ----------------------------------------------------------------------------
-- purchase_item
-- ----------------------------------------------------------------------------
create or replace function public.purchase_item(p_item_id uuid)
returns bigint
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_price bigint;
  v_balance bigint;
begin
  select price into v_price from public.shop_items where id = p_item_id;

  if v_price is null then
    raise exception 'unknown item';
  end if;

  if exists (select 1 from public.user_inventory where user_id = v_user_id and item_id = p_item_id) then
    raise exception 'item already owned';
  end if;

  insert into public.user_inventory (user_id, item_id) values (v_user_id, p_item_id);

  v_balance := public._adjust_coins(v_user_id, -v_price, 'shop_purchase', 'Purchased shop item');

  return v_balance;
end;
$$;

-- ----------------------------------------------------------------------------
-- send_friend_request / respond_friend_request
-- ----------------------------------------------------------------------------
create or replace function public.send_friend_request(p_username text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_target_id uuid;
  v_friendship_id uuid;
begin
  select id into v_target_id from public.profiles where username = p_username;

  if v_target_id is null then
    raise exception 'user not found';
  end if;

  if v_target_id = v_user_id then
    raise exception 'cannot friend yourself';
  end if;

  if exists (
    select 1 from public.friendships
    where (requester_id = v_user_id and recipient_id = v_target_id)
       or (requester_id = v_target_id and recipient_id = v_user_id)
  ) then
    raise exception 'friendship already exists or pending';
  end if;

  insert into public.friendships (requester_id, recipient_id)
  values (v_user_id, v_target_id)
  returning id into v_friendship_id;

  return v_friendship_id;
end;
$$;

create or replace function public.respond_friend_request(p_friendship_id uuid, p_accept boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  update public.friendships
  set status = case when p_accept then 'accepted' else 'declined' end,
      updated_at = now()
  where id = p_friendship_id and recipient_id = v_user_id and status = 'pending';

  if not found then
    raise exception 'friend request not found or not actionable';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- party flow: create_party, join_party, set_ready, start_match
-- ----------------------------------------------------------------------------
create or replace function public.create_party(p_game text, p_duration_seconds int, p_wager_coins bigint)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_party_id uuid;
begin
  insert into public.parties (host_id, game, duration_seconds, wager_coins)
  values (v_user_id, p_game, p_duration_seconds, p_wager_coins)
  returning id into v_party_id;

  insert into public.party_members (party_id, user_id) values (v_party_id, v_user_id);

  return v_party_id;
end;
$$;

create or replace function public.join_party(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member_count int;
begin
  select count(*) into v_member_count from public.party_members where party_id = p_party_id;

  if v_member_count >= 2 then
    raise exception 'party is full';
  end if;

  insert into public.party_members (party_id, user_id)
  values (p_party_id, v_user_id)
  on conflict (party_id, user_id) do nothing;
end;
$$;

create or replace function public.set_ready(p_party_id uuid, p_ready boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_all_ready boolean;
  v_member_count int;
  v_wager bigint;
  v_user1 uuid;
  v_user2 uuid;
  v_balance1 bigint;
  v_balance2 bigint;
  v_duration int;
  v_game text;
  v_match_id uuid;
begin
  update public.party_members set is_ready = p_ready
  where party_id = p_party_id and user_id = v_user_id;

  select count(*), bool_and(is_ready) into v_member_count, v_all_ready
  from public.party_members where party_id = p_party_id;

  if v_member_count = 2 and v_all_ready then
    select wager_coins, duration_seconds, game into v_wager, v_duration, v_game
    from public.parties where id = p_party_id;

    select user_id into v_user1 from public.party_members where party_id = p_party_id order by joined_at limit 1;
    select user_id into v_user2 from public.party_members where party_id = p_party_id order by joined_at desc limit 1;

    if v_wager > 0 then
      select coins into v_balance1 from public.profiles where id = v_user1;
      select coins into v_balance2 from public.profiles where id = v_user2;
      if v_balance1 < v_wager or v_balance2 < v_wager then
        raise exception 'one or more players do not have enough coins for this wager';
      end if;
    end if;

    insert into public.matches (party_id, game, duration_seconds, wager_coins)
    values (p_party_id, v_game, v_duration, v_wager)
    returning id into v_match_id;

    insert into public.match_players (match_id, user_id) values (v_match_id, v_user1), (v_match_id, v_user2);

    update public.parties set status = 'countdown', match_id = v_match_id where id = p_party_id;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- submit_score: client reports running score during a match (trusted client
-- model — acceptable for a casual word game; anti-cheat can be hardened later)
-- ----------------------------------------------------------------------------
create or replace function public.submit_score(p_match_id uuid, p_score int)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  update public.match_players
  set score = p_score
  where match_id = p_match_id and user_id = v_user_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- finish_match: settle wager, mark winner, update party status
-- ----------------------------------------------------------------------------
create or replace function public.finish_match(p_match_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_wager bigint;
  v_party_id uuid;
  v_user1 uuid; v_score1 int;
  v_user2 uuid; v_score2 int;
  v_winner uuid;
  v_loser uuid;
begin
  select wager_coins, party_id into v_wager, v_party_id from public.matches where id = p_match_id;

  if (select status from public.matches where id = p_match_id) = 'completed' then
    return (select winner_id from public.matches where id = p_match_id);
  end if;

  select user_id, score into v_user1, v_score1 from public.match_players where match_id = p_match_id order by user_id limit 1;
  select user_id, score into v_user2, v_score2 from public.match_players where match_id = p_match_id and user_id <> v_user1 limit 1;

  if v_score1 > v_score2 then
    v_winner := v_user1; v_loser := v_user2;
  elsif v_score2 > v_score1 then
    v_winner := v_user2; v_loser := v_user1;
  else
    v_winner := null; v_loser := null;
  end if;

  update public.matches set status = 'completed', ended_at = now(), winner_id = v_winner where id = p_match_id;

  if v_party_id is not null then
    update public.parties set status = 'completed' where id = v_party_id;
  end if;

  if v_wager > 0 and v_winner is not null then
    perform public._adjust_coins(v_winner, v_wager, 'match_win', 'Won wager match');
    perform public._adjust_coins(v_loser, -v_wager, 'match_loss', 'Lost wager match');
    update public.match_players set coins_delta = v_wager where match_id = p_match_id and user_id = v_winner;
    update public.match_players set coins_delta = -v_wager where match_id = p_match_id and user_id = v_loser;
  end if;

  return v_winner;
end;
$$;

-- ----------------------------------------------------------------------------
-- search_users: typeahead friend search
-- ----------------------------------------------------------------------------
create or replace function public.search_users(p_query text)
returns table (id uuid, username text, display_name text, avatar_url text)
language sql
security definer set search_path = public
as $$
  select id, username, display_name, avatar_url
  from public.profiles
  where username ilike '%' || p_query || '%'
    and id <> auth.uid()
  order by username
  limit 20;
$$;
