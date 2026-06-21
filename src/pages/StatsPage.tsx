import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useStats } from '@/hooks/useStats'
import { useAchievements } from '@/hooks/useAchievements'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { CoinTransaction } from '@/types'

export default function StatsPage() {
  const { stats } = useStats()
  const { all, unlockedIds } = useAchievements()
  const userId = useAuthStore((s) => s.user?.id)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data }) => setTransactions((data as CoinTransaction[]) ?? []))
  }, [userId])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-white">Your Stats</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Matches', value: stats?.totalMatches ?? 0 },
          { label: 'Wins', value: stats?.wins ?? 0 },
          { label: 'Losses', value: stats?.losses ?? 0 },
          { label: 'Win Rate', value: `${stats?.winRate ?? 0}%` },
          { label: 'Words', value: stats?.totalWordsSolved ?? 0 },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-xl font-extrabold text-violet-300">{s.value}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-white">Achievements</h2>
        <div className="flex flex-col gap-2">
          {all.map((a) => {
            const unlocked = unlockedIds.has(a.id)
            return (
              <div
                key={a.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  unlocked ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{unlocked ? '🏆' : '🔒'}</span>
                  <div>
                    <p className="font-semibold text-white">{a.name}</p>
                    <p className="text-xs text-white/50">{a.description}</p>
                  </div>
                </div>
                {a.coin_reward > 0 && <span className="text-sm font-bold text-amber-300">+{a.coin_reward}</span>}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-white">Recent Transactions</h2>
        <div className="flex flex-col divide-y divide-white/5">
          {transactions.length === 0 && <p className="py-4 text-center text-sm text-white/40">No transactions yet.</p>}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-white/80">{t.description ?? t.type}</p>
                <p className="text-xs text-white/35">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.amount >= 0 ? '+' : ''}
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
