import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { ShopItem } from '@/types'

const rarityColors: Record<string, string> = {
  common: 'border-white/15 text-white/60',
  rare: 'border-blue-400/40 text-blue-300',
  epic: 'border-purple-400/40 text-purple-300',
  legendary: 'border-amber-400/40 text-amber-300',
}

const typeLabels: Record<string, string> = {
  theme: 'Themes',
  avatar_frame: 'Avatar Frames',
  title: 'Titles',
}

export default function ShopPage() {
  const { profile, refreshProfile } = useAuthStore()
  const [items, setItems] = useState<ShopItem[]>([])
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: itemsData } = await supabase.from('shop_items').select('*').order('price')
    setItems((itemsData as ShopItem[]) ?? [])
    if (profile) {
      const { data: invData } = await supabase.from('user_inventory').select('item_id').eq('user_id', profile.id)
      setOwned(new Set((invData ?? []).map((r) => (r as { item_id: string }).item_id)))
    }
  }, [profile])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load()
  }, [load])

  async function handlePurchase(item: ShopItem) {
    setError(null)
    setBusyId(item.id)
    try {
      const { error: rpcError } = await supabase.rpc('purchase_item', { p_item_id: item.id })
      if (rpcError) throw rpcError
      await Promise.all([load(), refreshProfile()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleEquip(item: ShopItem) {
    if (!profile) return
    setBusyId(item.id)
    const column = item.type === 'theme' ? 'equipped_theme' : item.type === 'avatar_frame' ? 'equipped_avatar_frame' : 'equipped_title'
    const value = item.type === 'title' ? item.asset_ref : item.asset_ref
    await supabase.from('profiles').update({ [column]: value }).eq('id', profile.id)
    await refreshProfile()
    setBusyId(null)
  }

  const grouped = items.reduce<Record<string, ShopItem[]>>((acc, item) => {
    acc[item.type] = acc[item.type] ?? []
    acc[item.type].push(item)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-bold text-white">Cosmetic Shop</h1>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {Object.entries(grouped).map(([type, list]) => (
        <div key={type} className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-white/80">{typeLabels[type] ?? type}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((item) => {
              const isOwned = owned.has(item.id) || item.price === 0
              const isEquipped =
                (item.type === 'theme' && profile?.equipped_theme === item.asset_ref) ||
                (item.type === 'avatar_frame' && profile?.equipped_avatar_frame === item.asset_ref) ||
                (item.type === 'title' && profile?.equipped_title === item.asset_ref)

              return (
                <motion.div key={item.id} whileHover={{ y: -2 }}>
                  <Card className={`flex flex-col gap-2 border-2 ${rarityColors[item.rarity]}`}>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-white/45">{item.description}</p>
                    <p className={`text-xs font-bold uppercase ${rarityColors[item.rarity]}`}>{item.rarity}</p>
                    {isOwned ? (
                      <Button
                        size="sm"
                        variant={isEquipped ? 'secondary' : 'primary'}
                        disabled={isEquipped || busyId === item.id}
                        onClick={() => handleEquip(item)}
                      >
                        {isEquipped ? 'Equipped' : 'Equip'}
                      </Button>
                    ) : (
                      <Button size="sm" disabled={busyId === item.id} onClick={() => handlePurchase(item)}>
                        🪙 {item.price}
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
