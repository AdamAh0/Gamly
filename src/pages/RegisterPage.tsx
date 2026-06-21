import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const signUp = useAuthStore((s) => s.signUp)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { confirmedImmediately } = await signUp(email, password, username, displayName || username)
      if (confirmedImmediately) {
        navigate('/app')
      } else {
        setDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
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
          {done ? (
            <div className="text-center">
              <div className="mb-3 text-4xl">📬</div>
              <h1 className="mb-2 text-2xl font-bold">Check your inbox</h1>
              <p className="mb-6 text-sm text-white/55">
                We've sent a confirmation link to <span className="text-white">{email}</span>. Confirm your email,
                then sign in.
              </p>
              <Link to="/login">
                <Button size="lg" className="w-full">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
              <p className="mb-6 text-sm text-white/55">Join Gamly and start competing today.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                />
                <input
                  placeholder="Display name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                />
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
                  minLength={6}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
                  {loading ? 'Creating account…' : 'Create Account'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-white/55">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
