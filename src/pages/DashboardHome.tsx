import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { CreatePartyModal } from '@/components/party/CreatePartyModal'
import { useAuthStore } from '@/store/authStore'
import { useStats } from '@/hooks/useStats'
import { useAchievements } from '@/hooks/useAchievements'
import { supabase } from '@/lib/supabase'

export default function DashboardHome() {
  const { profile, refreshProfile } = useAuthStore()
  const { stats } = useStats()
  const { all, unlockedIds } = useAchievements()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreateParty, setShowCreateParty] = useState(false)
  const [inviteFriendId, setInviteFriendId] = useState<string | undefined>(undefined)
  const [claiming, setClaiming] = useState(false)
  const [claimMsg, setClaimMsg] = useState<string | null>(null)

  useEffect(() => {
    const invite = searchParams.get('invite')
    if (invite) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing one-off URL param into modal state
      setInviteFriendId(invite)
      setShowCreateParty(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const canClaimDaily =
    !profile?.last_daily_claim_at || new Date(profile.last_daily_claim_at).toDateString() !== new Date().toDateString()

  async function handleClaim() {
    setClaiming(true)
    setClaimMsg(null)
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward').single()
      if (error) throw error
      const result = data as { coins_awarded: number; new_streak: number }
      setClaimMsg(`+${result.coins_awarded} coins! (Day ${result.new_streak} streak)`)
      await refreshProfile()
    } catch (err) {
      setClaimMsg(err instanceof Error ? err.message : 'Failed to claim')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile?.display_name ?? ''}
              avatarUrl={profile?.avatar_url}
              frame={profile?.equipped_avatar_frame}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{profile?.display_name}</h1>
              <p className="text-sm text-white/50">@{profile?.username}</p>
              {profile?.equipped_title && (
                <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                  {profile.equipped_title}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button onClick={handleClaim} disabled={!canClaimDaily || claiming} variant="secondary" size="sm">
              {canClaimDaily ? '🎁 Claim Daily Reward' : '✓ Claimed Today'}
            </Button>
            {claimMsg && <p className="text-xs text-emerald-400">{claimMsg}</p>}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Wins', value: stats?.wins ?? 0, color: 'text-emerald-400' },
          { label: 'Losses', value: stats?.losses ?? 0, color: 'text-red-400' },
          { label: 'Win Rate', value: `${stats?.winRate ?? 0}%`, color: 'text-violet-300' },
          { label: 'Words Solved', value: stats?.totalWordsSolved ?? 0, color: 'text-amber-300' },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Games</h2>
        </div>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex flex-col items-center justify-between gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 p-5 sm:flex-row"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚡📝</div>
            <div>
              <h3 className="text-xl font-bold text-white">Wordle Rush</h3>
              <p className="text-sm text-white/55">1v1 real-time word solving race. Most words solved wins.</p>
            </div>
          </div>
          <Button size="lg" onClick={() => setShowCreateParty(true)}>
            Play Now
          </Button>
        </motion.div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Achievements</h2>
          <span className="text-sm text-white/50">
            {unlockedIds.size}/{all.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {all.map((a) => {
            const unlocked = unlockedIds.has(a.id)
            return (
              <div
                key={a.id}
                className={`rounded-xl border p-3 text-center transition-opacity ${
                  unlocked ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 opacity-40'
                }`}
                title={a.description}
              >
                <div className="mb-1 text-2xl">{unlocked ? '🏆' : '🔒'}</div>
                <p className="truncate text-xs font-semibold text-white">{a.name}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {showCreateParty && (
        <CreatePartyModal
          preselectedFriendId={inviteFriendId}
          onClose={() => {
            setShowCreateParty(false)
            setInviteFriendId(undefined)
          }}
        />
      )}
    </div>
  )
}
