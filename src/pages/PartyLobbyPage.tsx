import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { useParty } from '@/hooks/useParty'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

export default function PartyLobbyPage() {
  const { partyId } = useParams<{ partyId: string }>()
  const { party, members, loading } = useParty(partyId)
  const userId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const me = members.find((m) => m.user_id === userId)
  const opponent = members.find((m) => m.user_id !== userId)

  useEffect(() => {
    if (party?.status === 'countdown') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local countdown to server status change
      setCountdown(3)
    }
  }, [party?.status])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      if (party?.match_id) navigate(`/app/play/${party.match_id}`)
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [countdown, party?.match_id, navigate])

  async function toggleReady() {
    if (!partyId || !me) return
    setError(null)
    const { error: rpcError } = await supabase.rpc('set_ready', { p_party_id: partyId, p_ready: !me.is_ready })
    if (rpcError) setError(rpcError.message)
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-white/50">Loading lobby…</div>
  }

  if (!party) {
    return <div className="flex h-64 items-center justify-center text-white/50">Party not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <h1 className="mb-1 text-2xl font-bold text-white">Wordle Rush Lobby</h1>
        <div className="mb-6 flex items-center justify-center gap-3 text-sm text-white/55">
          <span>⏱ {party.duration_seconds / 60} min</span>
          {party.wager_coins > 0 ? <CoinBadge amount={party.wager_coins} /> : <span>Free play</span>}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          {[me, opponent].map((m, i) => (
            <div
              key={m?.user_id ?? i}
              className={`flex flex-col items-center gap-2 rounded-xl border p-5 ${
                m?.is_ready ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/10'
              }`}
            >
              {m ? (
                <>
                  <Avatar name={m.profile.display_name} avatarUrl={m.profile.avatar_url} frame={m.profile.equipped_avatar_frame} size="lg" />
                  <p className="font-semibold text-white">{m.profile.display_name}</p>
                  <span className={`text-xs font-medium ${m.is_ready ? 'text-emerald-400' : 'text-white/40'}`}>
                    {m.is_ready ? 'Ready ✓' : 'Not ready'}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/15 text-2xl text-white/20">
                    ?
                  </div>
                  <p className="text-sm text-white/40">Waiting for opponent…</p>
                </>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {opponent && party.status === 'lobby' && (
          <Button size="lg" onClick={toggleReady} variant={me?.is_ready ? 'secondary' : 'primary'}>
            {me?.is_ready ? 'Cancel Ready' : "I'm Ready"}
          </Button>
        )}

        {!opponent && (
          <p className="text-sm text-white/40">Share this lobby — they need to accept your challenge invite.</p>
        )}
      </Card>

      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="accent-text-gradient text-9xl font-extrabold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
