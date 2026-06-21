import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Party, PartyMember, Profile } from '@/types'

export function useParty(partyId: string | undefined) {
  const [party, setParty] = useState<Party | null>(null)
  const [members, setMembers] = useState<(PartyMember & { profile: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!partyId) return
    const [partyRes, membersRes] = await Promise.all([
      supabase.from('parties').select('*').eq('id', partyId).single(),
      supabase.from('party_members').select('*, profile:profiles(*)').eq('party_id', partyId).order('joined_at'),
    ])
    if (partyRes.data) setParty(partyRes.data as Party)
    if (membersRes.data) setMembers(membersRes.data as unknown as (PartyMember & { profile: Profile })[])
    setLoading(false)
  }, [partyId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load()
  }, [load])

  useEffect(() => {
    if (!partyId) return
    const channel = supabase
      .channel(`party-${partyId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partyId, load])

  return { party, members, loading, reload: load }
}
