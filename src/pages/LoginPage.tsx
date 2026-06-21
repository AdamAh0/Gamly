import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithPassword(email, password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-6 text-white">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <Card className="px-8 py-10">
          <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
          <p className="mb-6 text-sm text-white/55">Sign in to continue playing.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
              Register
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
