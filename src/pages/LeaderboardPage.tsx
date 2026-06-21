import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useFriends } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'global' | 'friends'>('global')
  const [board, setBoard] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const userId = useAuthStore((s) => s.user?.id)
  const { friends } = useFriends()

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (tab === 'global') {
        const { data } = await supabase.from('profiles').select('*').order('coins', { ascending: false }).limit(50)
        setBoard((data as Profile[]) ?? [])
      } else {
        const ids = [...friends.map((f) => f.profile.id), userId].filter(Boolean) as string[]
        if (ids.length === 0) {
          setBoard([])
        } else {
          const { data } = await supabase.from('profiles').select('*').in('id', ids).order('coins', { ascending: false })
          setBoard((data as Profile[]) ?? [])
        }
      }
      setLoading(false)
    }
    load()
  }, [tab, friends, userId])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-white">Leaderboard</h1>

      <div className="mb-4 flex gap-1 rounded-lg bg-white/5 p-1 text-sm">
        <button
          onClick={() => setTab('global')}
          className={`flex-1 rounded-md py-2 font-medium transition-colors ${tab === 'global' ? 'bg-white/10 text-white' : 'text-white/50'}`}
        >
          🌍 Global
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 rounded-md py-2 font-medium transition-colors ${tab === 'friends' ? 'bg-white/10 text-white' : 'text-white/50'}`}
        >
          👥 Friends
        </button>
      </div>

      <Card className="p-2">
        {loading && <p className="px-4 py-6 text-center text-sm text-white/40">Loading…</p>}
        {!loading && board.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-white/40">No players to show yet.</p>
        )}
        {board.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`flex items-center justify-between rounded-xl px-4 py-3 ${p.id === userId ? 'bg-violet-500/10' : 'hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-6 text-center text-lg font-bold ${
                  i === 0 ? 'text-amber-300' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-white/40'
                }`}
              >
                {i + 1}
              </span>
              <Avatar name={p.display_name} avatarUrl={p.avatar_url} frame={p.equipped_avatar_frame} size="sm" />
              <span className="font-medium text-white">{p.display_name}</span>
            </div>
            <span className="font-bold text-amber-300">🪙 {p.coins.toLocaleString()}</span>
          </motion.div>
        ))}
      </Card>
    </div>
  )
}
