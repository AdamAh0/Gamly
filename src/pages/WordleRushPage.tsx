import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { WordleBoard } from '@/components/game/WordleBoard'
import { useMatch } from '@/hooks/useMatch'
import { useAuthStore } from '@/store/authStore'
import { generateWordSequence } from '@/lib/wordleEngine'
import { supabase } from '@/lib/supabase'

export default function WordleRushPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { match, players, loading } = useMatch(matchId)
  const userId = useAuthStore((s) => s.user?.id)
  const navigate = useNavigate()

  const [wordIndex, setWordIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const finishCalledRef = useRef(false)
  const pendingSubmitRef = useRef<PromiseLike<unknown> | null>(null)

  const wordSequence = useMemo(() => (match ? generateWordSequence(match.seed) : []), [match])

  const me = players.find((p) => p.user_id === userId)
  const opponent = players.find((p) => p.user_id !== userId)

  useEffect(() => {
    if (!match) return
    function tick() {
      const startedAt = new Date(match!.started_at).getTime()
      const elapsed = (Date.now() - startedAt) / 1000
      setTimeLeft(Math.max(0, Math.round(match!.duration_seconds - elapsed)))
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [match])

  useEffect(() => {
    if (timeLeft === 0 && match?.status === 'in_progress' && !finishCalledRef.current) {
      finishCalledRef.current = true
      void (async () => {
        if (pendingSubmitRef.current) await pendingSubmitRef.current
        const { error } = await supabase.rpc('finish_match', { p_match_id: match.id })
        if (error) console.error('finish_match failed', error)
      })()
    }
  }, [timeLeft, match])

  function reportScore(next: number) {
    setScore(next)
    if (matchId) {
      pendingSubmitRef.current = supabase.rpc('submit_score', { p_match_id: matchId, p_score: next }).then(({ error }) => {
        if (error) console.error('submit_score failed', error)
      })
    }
  }

  function handleSolved() {
    reportScore(score + 1)
    setWordIndex((i) => i + 1)
  }

  function handleFailed() {
    setWordIndex((i) => i + 1)
  }

  const isOver = match?.status === 'completed' || timeLeft === 0

  if (loading || !match) {
    return <div className="flex h-64 items-center justify-center text-white/50">Loading match…</div>
  }

  if (isOver) {
    const finalMe = players.find((p) => p.user_id === userId)
    const finalOpponent = players.find((p) => p.user_id !== userId)
    const iWon = match.winner_id === userId
    const tied = match.winner_id === null && match.status === 'completed'

    return (
      <div className="mx-auto max-w-xl">
        <Card className="text-center">
          <div className="mb-2 text-5xl">{tied ? '🤝' : iWon ? '🏆' : '💀'}</div>
          <h1 className="mb-1 text-3xl font-extrabold text-white">
            {match.status !== 'completed' ? 'Finishing up…' : tied ? "It's a tie!" : iWon ? 'Victory!' : 'Defeat'}
          </h1>
          {match.wager_coins > 0 && match.status === 'completed' && !tied && (
            <p className={`mb-6 font-semibold ${iWon ? 'text-emerald-400' : 'text-red-400'}`}>
              {iWon ? `+${match.wager_coins}` : `-${match.wager_coins}`} coins
            </p>
          )}

          <div className="my-6 grid grid-cols-2 gap-4">
            {[finalMe, finalOpponent].map((p, i) => (
              <div key={p?.user_id ?? i} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 p-5">
                {p && <Avatar name={p.profile.display_name} avatarUrl={p.profile.avatar_url} size="lg" />}
                <p className="font-semibold text-white">{p?.profile.display_name}</p>
                <p className="text-3xl font-extrabold text-violet-300">{p?.score ?? 0}</p>
                <p className="text-xs text-white/40">words solved</p>
              </div>
            ))}
          </div>

          <Button size="lg" onClick={() => navigate('/app')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const target = wordSequence[wordIndex] ?? wordSequence[0]
  const minutes = Math.floor((timeLeft ?? 0) / 60)
  const seconds = (timeLeft ?? 0) % 60

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={me?.profile.display_name ?? 'You'} avatarUrl={me?.profile.avatar_url} size="sm" />
          <div>
            <p className="text-sm font-semibold text-white">{me?.profile.display_name ?? 'You'}</p>
            <p className="text-xs text-white/40">Word #{wordIndex + 1}</p>
          </div>
          <motion.span
            key={score}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-violet-500/15 px-3 py-1 text-lg font-extrabold text-violet-300"
          >
            {score}
          </motion.span>
        </div>

        <div className="text-2xl font-mono font-bold text-white">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/5 px-3 py-1 text-lg font-extrabold text-white/70">
            {opponent?.score ?? 0}
          </span>
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{opponent?.profile.display_name ?? 'Opponent'}</p>
            <p className="text-xs text-white/40">live score</p>
          </div>
          <Avatar name={opponent?.profile.display_name ?? 'Opponent'} avatarUrl={opponent?.profile.avatar_url} size="sm" />
        </div>
      </Card>

      <div className="flex justify-center">
        <WordleBoard key={wordIndex} target={target} onSolved={handleSolved} onFailed={handleFailed} />
      </div>
    </div>
  )
}
