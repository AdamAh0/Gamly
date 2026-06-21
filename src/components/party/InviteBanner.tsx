import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import type { PartyInvite } from '@/hooks/usePartyInvites'

export function InviteBanner({ invite, onDismiss }: { invite: PartyInvite | null; onDismiss: () => void }) {
  const navigate = useNavigate()

  async function accept() {
    if (!invite) return
    await supabase.rpc('join_party', { p_party_id: invite.partyId })
    onDismiss()
    navigate(`/app/party/${invite.partyId}`)
  }

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          initial={{ opacity: 0, y: -30, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -30, x: '-50%' }}
          className="glass fixed left-1/2 top-4 z-50 flex items-center gap-4 rounded-2xl px-5 py-3 shadow-2xl"
        >
          <div className="text-2xl">⚔️</div>
          <div>
            <p className="text-sm font-semibold text-white">{invite.fromName} challenges you!</p>
            <p className="text-xs text-white/55">
              Wordle Rush · {invite.durationSeconds / 60} min · {invite.wagerCoins > 0 ? `🪙 ${invite.wagerCoins} wager` : 'Free play'}
            </p>
          </div>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
          <button onClick={onDismiss} className="text-white/40 hover:text-white">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
