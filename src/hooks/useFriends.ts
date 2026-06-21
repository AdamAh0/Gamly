import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Friendship, Profile } from '@/types'

export interface FriendEntry {
  friendshipId: string
  profile: Profile
}

export function useFriends() {
  const userId = useAuthStore((s) => s.user?.id)
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [incoming, setIncoming] = useState<FriendEntry[]>([])
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*), recipient:profiles!friendships_recipient_id_fkey(*)')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

    if (!error && data) {
      const rows = data as unknown as (Friendship & { requester: Profile; recipient: Profile })[]
      const acc: FriendEntry[] = []
      const inc: FriendEntry[] = []
      const out: FriendEntry[] = []

      for (const row of rows) {
        const isRequester = row.requester_id === userId
        const other = isRequester ? row.recipient : row.requester

        if (row.status === 'accepted') {
          acc.push({ friendshipId: row.id, profile: other })
        } else if (row.status === 'pending' && !isRequester) {
          inc.push({ friendshipId: row.id, profile: other })
        } else if (row.status === 'pending' && isRequester) {
          out.push({ friendshipId: row.id, profile: other })
        }
      }

      setFriends(acc)
      setIncoming(inc)
      setOutgoing(out)
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load()
  }, [load])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`friendships-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  const sendRequest = useCallback(async (username: string) => {
    const { error } = await supabase.rpc('send_friend_request', { p_username: username })
    if (error) throw error
    await load()
  }, [load])

  const respondRequest = useCallback(async (friendshipId: string, accept: boolean) => {
    const { error } = await supabase.rpc('respond_friend_request', {
      p_friendship_id: friendshipId,
      p_accept: accept,
    })
    if (error) throw error
    await load()
  }, [load])

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (error) throw error
    await load()
  }, [load])

  return { friends, incoming, outgoing, loading, sendRequest, respondRequest, removeFriend, reload: load }
}
