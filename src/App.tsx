import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardLayout from '@/pages/DashboardLayout'
import DashboardHome from '@/pages/DashboardHome'
import LeaderboardPage from '@/pages/LeaderboardPage'
import ShopPage from '@/pages/ShopPage'
import StatsPage from '@/pages/StatsPage'
import PartyLobbyPage from '@/pages/PartyLobbyPage'
import WordleRushPage from '@/pages/WordleRushPage'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    const unsubscribe = initialize()
    return unsubscribe
  }, [initialize])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="party/:partyId" element={<PartyLobbyPage />} />
          <Route path="play/:matchId" element={<WordleRushPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
