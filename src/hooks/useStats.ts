import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export interface PlayerStats {
  wins: number
  losses: number
  ties: number
  totalMatches: number
  totalWordsSolved: number
  winRate: number
}

export function useStats() {
  const userId = useAuthStore((s) => s.user?.id)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let active = true

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('match_players')
        .select('score, match:matches!inner(id, status, winner_id)')
        .eq('user_id', userId)
        .eq('match.status', 'completed')

      if (!active) return

      const rows = (data as unknown as { score: number; match: { id: string; winner_id: string | null } }[]) ?? []
      let wins = 0
      let losses = 0
      let ties = 0
      let totalWordsSolved = 0

      for (const row of rows) {
        totalWordsSolved += row.score
        if (row.match.winner_id === null) ties++
        else if (row.match.winner_id === userId) wins++
        else losses++
      }

      const totalMatches = rows.length
      setStats({
        wins,
        losses,
        ties,
        totalMatches,
        totalWordsSolved,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
      })
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [userId])

  return { stats, loading }
}
