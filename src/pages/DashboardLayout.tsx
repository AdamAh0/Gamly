import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { CoinBadge } from '@/components/ui/CoinBadge'
import { Avatar } from '@/components/ui/Avatar'
import { SocialSidebar } from '@/components/social/SocialSidebar'
import { InviteBanner } from '@/components/party/InviteBanner'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { usePartyInvites } from '@/hooks/usePartyInvites'
import clsx from 'clsx'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: '🏠' },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/app/shop', label: 'Shop', icon: '🛍️' },
  { to: '/app/stats', label: 'Stats', icon: '📊' },
]

export default function DashboardLayout() {
  const { profile, signOut } = useAuthStore()
  const { mode, toggleMode } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { invite, dismiss } = usePartyInvites()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-white">
      <InviteBanner invite={invite} onDismiss={dismiss} />
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-surface-950/80 px-6 py-3 backdrop-blur-lg">
        <Link to="/app">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full bg-white/5 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                location.pathname === item.to ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white',
              )}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile && <CoinBadge amount={profile.coins} />}
          <button
            onClick={toggleMode}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
            title="Toggle theme"
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          {profile && (
            <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} frame={profile.equipped_avatar_frame} size="sm" />
          )}
          <button onClick={handleSignOut} className="text-sm text-white/50 hover:text-white">
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex items-center gap-1 overflow-x-auto border-b border-white/5 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={clsx(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
              location.pathname === item.to ? 'bg-white/10 text-white' : 'text-white/55',
            )}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-5 px-4 py-6 lg:px-6">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <div className="hidden lg:block">
          <SocialSidebar />
        </div>
      </div>
    </div>
  )
}
