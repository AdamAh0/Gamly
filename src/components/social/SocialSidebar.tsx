import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useFriends } from '@/hooks/useFriends'
import { supabase } from '@/lib/supabase'
import { isOnline } from '@/lib/presence'

interface SearchResult {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

export function SocialSidebar() {
  const { friends, incoming, sendRequest, respondRequest } = useFriends()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState<'friends' | 'requests'>('friends')
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(interval)
  }, [])

  async function handleSearch(value: string) {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase.rpc('search_users', { p_query: value.trim() })
    setResults((data as SearchResult[]) ?? [])
    setSearching(false)
  }

  async function handleAdd(username: string) {
    try {
      await sendRequest(username)
      setQuery('')
      setResults([])
    } catch (err) {
      console.error(err)
    }
  }

  function invite(friendId: string) {
    navigate(`/app?invite=${friendId}`)
  }

  return (
    <aside className="glass flex h-full w-72 flex-shrink-0 flex-col rounded-2xl p-4">
      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400/50"
        />
        <AnimatePresence>
          {query.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-surface-800"
            >
              {searching && <p className="px-3 py-2 text-xs text-white/40">Searching…</p>}
              {!searching && results.length === 0 && (
                <p className="px-3 py-2 text-xs text-white/40">No users found</p>
              )}
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 hover:bg-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar name={r.display_name} avatarUrl={r.avatar_url} size="sm" />
                    <span>{r.username}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(r.username)}
                    className="text-xs font-semibold text-violet-300 hover:text-violet-200"
                  >
                    Add
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-3 flex gap-1 rounded-lg bg-white/5 p-1 text-sm">
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${tab === 'friends' ? 'bg-white/10 text-white' : 'text-white/50'}`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          className={`relative flex-1 rounded-md py-1.5 font-medium transition-colors ${tab === 'requests' ? 'bg-white/10 text-white' : 'text-white/50'}`}
        >
          Requests
          {incoming.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px]">
              {incoming.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {tab === 'friends' &&
          (friends.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-white/40">No friends yet — search above to add some.</p>
          ) : (
            friends.map((f) => (
              <div key={f.friendshipId} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={f.profile.display_name} avatarUrl={f.profile.avatar_url} frame={f.profile.equipped_avatar_frame} size="sm" online={isOnline(f.profile)} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{f.profile.display_name}</p>
                    <p className="text-xs capitalize leading-tight text-white/40">
                      {isOnline(f.profile) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => invite(f.profile.id)}
                  className="text-xs font-semibold text-violet-300 hover:text-violet-200"
                >
                  Invite
                </button>
              </div>
            ))
          ))}

        {tab === 'requests' &&
          (incoming.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-white/40">No pending requests.</p>
          ) : (
            incoming.map((r) => (
              <div key={r.friendshipId} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.profile.display_name} avatarUrl={r.profile.avatar_url} size="sm" />
                  <p className="text-sm font-medium">{r.profile.display_name}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => respondRequest(r.friendshipId, true)}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => respondRequest(r.friendshipId, false)}>
                    ✕
                  </Button>
                </div>
              </div>
            ))
          ))}
      </div>
    </aside>
  )
}
