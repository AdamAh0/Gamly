import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Achievement } from '@/types'

export function useAchievements() {
  const userId = useAuthStore((s) => s.user?.id)
  const [all, setAll] = useState<Achievement[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let active = true

    async function load() {
      setLoading(true)
      const [achievementsRes, unlockedRes] = await Promise.all([
        supabase.from('achievements').select('*').order('coin_reward'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
      ])
      if (!active) return
      setAll((achievementsRes.data as Achievement[]) ?? [])
      setUnlockedIds(new Set((unlockedRes.data ?? []).map((r) => (r as { achievement_id: string }).achievement_id)))
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [userId])

  return { all, unlockedIds, loading }
}
