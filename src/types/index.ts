export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  coins: number
  status: 'online' | 'offline' | 'in_game'
  last_seen: string
  equipped_theme: string
  equipped_avatar_frame: string
  equipped_title: string | null
  daily_streak: number
  last_daily_claim_at: string | null
  created_at: string
}

export interface CoinTransaction {
  id: string
  user_id: string
  amount: number
  balance_after: number
  type: 'match_win' | 'match_loss' | 'daily_reward' | 'achievement' | 'shop_purchase' | 'admin_adjustment'
  description: string | null
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
  updated_at: string
  requester?: Profile
  recipient?: Profile
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  coin_reward: number
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

export type MatchDuration = 120 | 300 | 600

export interface Party {
  id: string
  host_id: string
  game: string
  status: 'lobby' | 'countdown' | 'in_progress' | 'completed' | 'cancelled'
  duration_seconds: MatchDuration
  wager_coins: number
  match_id: string | null
  created_at: string
}

export interface PartyMember {
  party_id: string
  user_id: string
  is_ready: boolean
  joined_at: string
  profile?: Profile
}

export interface Match {
  id: string
  party_id: string | null
  game: string
  duration_seconds: number
  wager_coins: number
  seed: string
  status: 'in_progress' | 'completed' | 'cancelled'
  winner_id: string | null
  started_at: string
  ended_at: string | null
}

export interface MatchPlayer {
  match_id: string
  user_id: string
  score: number
  coins_delta: number
  profile?: Profile
}

export interface ShopItem {
  id: string
  code: string
  name: string
  description: string | null
  type: 'theme' | 'avatar_frame' | 'title'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  asset_ref: string
}
