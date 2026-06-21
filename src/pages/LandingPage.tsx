import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const features = [
  {
    icon: '⚡',
    title: 'Real-time Multiplayer',
    description: 'Face off against friends or strangers with millisecond-fast realtime sync powered by Supabase.',
  },
  {
    icon: '🪙',
    title: 'Coin Wagers',
    description: 'Bet coins on matches, win big, climb the leaderboard, and unlock exclusive cosmetics.',
  },
  {
    icon: '👥',
    title: 'Party System',
    description: 'Invite friends to a private party, pick your game mode, ready up, and battle.',
  },
  {
    icon: '🏆',
    title: 'Achievements & Stats',
    description: 'Track your progress, unlock achievements, and prove your skill on global leaderboards.',
  },
]

const leaders = [
  { rank: 1, name: 'lexi_queen', coins: 48210, wins: 312 },
  { rank: 2, name: 'word_ninja', coins: 39870, wins: 287 },
  { rank: 3, name: 'rushmaster', coins: 33120, wins: 254 },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="animate-float absolute -right-32 top-64 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl [animation-delay:2s]" />
        <div className="animate-glow absolute left-1/2 top-1/3 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Register</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live now: Wordle Rush 1v1
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
        >
          Play fast.<br />
          <span className="accent-text-gradient">Compete harder.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 max-w-xl text-lg text-white/60"
        >
          Gamly is a real-time multiplayer gaming platform. Challenge friends, wager coins, and climb the
          leaderboard — starting with Wordle Rush.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Link to="/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">I already have an account</Button>
          </Link>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
        <h2 className="mb-10 text-center text-3xl font-bold">Everything you need to compete</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full transition-transform hover:-translate-y-1">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1.5 font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-white/55">{f.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-28">
        <h2 className="mb-6 text-center text-3xl font-bold">Global Leaderboard</h2>
        <Card className="p-2">
          {leaders.map((l, i) => (
            <motion.div
              key={l.rank}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <span
                  className={
                    l.rank === 1
                      ? 'text-xl font-bold text-amber-300'
                      : l.rank === 2
                        ? 'text-xl font-bold text-zinc-300'
                        : 'text-xl font-bold text-orange-400'
                  }
                >
                  #{l.rank}
                </span>
                <span className="font-medium">{l.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <span>{l.wins} wins</span>
                <span className="font-bold text-amber-300">🪙 {l.coins.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </Card>
      </section>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pb-24 text-center">
        <Card className="px-8 py-12">
          <h2 className="mb-3 text-3xl font-bold">Ready to play?</h2>
          <p className="mb-8 text-white/60">Create your free account and challenge a friend in under a minute.</p>
          <Link to="/register">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </Card>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} Gamly. Built for competitive fun.
      </footer>
    </div>
  )
}
