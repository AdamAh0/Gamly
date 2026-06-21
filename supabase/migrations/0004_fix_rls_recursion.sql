-- ============================================================================
-- Fix infinite-recursion RLS policies: "party_members" and "match_players"
-- each had a SELECT policy whose USING clause queried the same table,
-- which Postgres rejects as infinite recursion (42P17), surfaced by
-- PostgREST as a 500. Replace the self-referencing subqueries with
-- SECURITY DEFINER helper functions, which bypass RLS and break the cycle.
-- ============================================================================

create or replace function public.is_member_of_party(p_party_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.party_members
    where party_id = p_party_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_participant_in_match(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  );
$$;

drop policy "party members can view their party" on public.parties;
create policy "party members can view their party"
  on public.parties for select
  to authenticated
  using (
    host_id = auth.uid()
    or public.is_member_of_party(id)
  );

drop policy "party members can view membership" on public.party_members;
create policy "party members can view membership"
  on public.party_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or party_id in (select id from public.parties where host_id = auth.uid())
    or public.is_member_of_party(party_id)
  );

drop policy "match participants can view match" on public.matches;
create policy "match participants can view match"
  on public.matches for select
  to authenticated
  using (public.is_participant_in_match(id));

drop policy "match participants can view match_players" on public.match_players;
create policy "match participants can view match_players"
  on public.match_players for select
  to authenticated
  using (public.is_participant_in_match(match_id));
