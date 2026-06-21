import type { Profile } from '@/types'

const ONLINE_THRESHOLD_MS = 45_000

export function isOnline(profile: Profile): boolean {
  if (profile.status === 'offline') return false
  const lastSeen = new Date(profile.last_seen).getTime()
  return Date.now() - lastSeen < ONLINE_THRESHOLD_MS
}
