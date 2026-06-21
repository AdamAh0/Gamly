import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Match, MatchPlayer, Profile } from '@/types'

export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<(MatchPlayer & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!matchId) return
    const [matchRes, playersRes] = await Promise.all([
      supabase.from('matches').select('*').eq('id', matchId).single(),
      supabase.from('match_players').select('*, profile:profiles(*)').eq('match_id', matchId),
    ])
    if (matchRes.data) setMatch(matchRes.data as Match)
    if (playersRes.data) setPlayers(playersRes.data as unknown as (MatchPlayer & { profile: Profile })[])
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load()
  }, [load])

  useEffect(() => {
    if (!matchId) return
    const channel = supabase
      .channel(`match-${matchId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, load])

  return { match, players, loading, reload: load }
}
