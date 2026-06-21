import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface PartyInvite {
  partyId: string
  fromName: string
  game: string
  wagerCoins: number
  durationSeconds: number
}

export function usePartyInvites() {
  const userId = useAuthStore((s) => s.user?.id)
  const [invite, setInvite] = useState<PartyInvite | null>(null)

  useEffect(() => {
    if (!userId) return
    const topic = `user:${userId}`

    // Guard against React effect double-invocation (StrictMode in dev): a stale
    // channel for this same well-known topic may still be tearing down.
    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}`) supabase.removeChannel(existing)
    }

    const channel = supabase
      .channel(topic)
      .on('broadcast', { event: 'party_invite' }, ({ payload }) => {
        setInvite(payload as PartyInvite)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { invite, dismiss: () => setInvite(null) }
}

export async function sendPartyInvite(targetUserId: string, invite: PartyInvite) {
  const channel = supabase.channel(`user:${targetUserId}`)
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({ type: 'broadcast', event: 'party_invite', payload: invite })
        setTimeout(() => {
          supabase.removeChannel(channel)
          resolve()
        }, 400)
      }
    })
  })
}
