import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useFriends } from '@/hooks/useFriends'
import { sendPartyInvite } from '@/hooks/usePartyInvites'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const DURATIONS = [
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
]

const WAGERS = [0, 25, 50, 100, 250, 500]

export function CreatePartyModal({ onClose, preselectedFriendId }: { onClose: () => void; preselectedFriendId?: string }) {
  const { friends } = useFriends()
  const profile = useAuthStore((s) => s.profile)
  const navigate = useNavigate()
  const [friendId, setFriendId] = useState(preselectedFriendId ?? '')
  const [duration, setDuration] = useState(120)
  const [wager, setWager] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedFriend = friends.find((f) => f.profile.id === friendId)

  async function handleCreate() {
    if (!friendId) {
      setError('Pick a friend to challenge')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: partyId, error: rpcError } = await supabase.rpc('create_party', {
        p_game: 'wordle_rush',
        p_duration_seconds: duration,
        p_wager_coins: wager,
      })
      if (rpcError) throw rpcError

      await sendPartyInvite(friendId, {
        partyId: partyId as string,
        fromName: profile?.display_name ?? 'A friend',
        game: 'wordle_rush',
        wagerCoins: wager,
        durationSeconds: duration,
      })

      navigate(`/app/party/${partyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass w-full max-w-md rounded-2xl p-6"
        >
          <h2 className="mb-4 text-xl font-bold text-white">Challenge a Friend — Wordle Rush</h2>

          <p className="mb-2 text-sm font-medium text-white/70">Opponent</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {friends.length === 0 && (
              <p className="col-span-3 text-sm text-white/40">Add a friend first to challenge them.</p>
            )}
            {friends.map((f) => (
              <button
                key={f.profile.id}
                onClick={() => setFriendId(f.profile.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors ${
                  friendId === f.profile.id ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'
                }`}
              >
                <Avatar name={f.profile.display_name} avatarUrl={f.profile.avatar_url} size="sm" />
                <span className="truncate">{f.profile.display_name}</span>
              </button>
            ))}
          </div>

          <p className="mb-2 text-sm font-medium text-white/70">Match Duration</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                  duration === d.value ? 'border-violet-400 bg-violet-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-sm font-medium text-white/70">Coin Wager</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {WAGERS.map((w) => (
              <button
                key={w}
                onClick={() => setWager(w)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  wager === w ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-white/10 text-white/60 hover:bg-white/5'
                }`}
              >
                {w === 0 ? 'Free' : `🪙 ${w}`}
              </button>
            ))}
          </div>

          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading || !selectedFriend} className="flex-1">
              {loading ? 'Sending…' : 'Send Challenge'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
