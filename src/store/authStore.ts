import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { useThemeStore } from '@/store/themeStore'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialize: () => () => void
  refreshProfile: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ confirmedImmediately: boolean }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,

  initialize: () => {
    function markOnline(userId: string) {
      void supabase.from('profiles').update({ status: 'online', last_seen: new Date().toISOString() }).eq('id', userId)
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
      if (data.session?.user) {
        void get().refreshProfile()
        markOnline(data.session.user.id)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        void get().refreshProfile()
        markOnline(session.user.id)
      } else {
        set({ profile: null })
      }
    })

    const heartbeat = setInterval(() => {
      const userId = get().user?.id
      if (userId && document.visibilityState === 'visible') markOnline(userId)
    }, 20_000)

    return () => {
      sub.subscription.unsubscribe()
      clearInterval(heartbeat)
    }
  },

  refreshProfile: async () => {
    const userId = get().user?.id
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      set({ profile: data as Profile })
      useThemeStore.getState().setCosmetic((data as Profile).equipped_theme ?? 'default')
    }
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password, username, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    })
    if (error) throw error
    if (data.session) {
      set({ session: data.session, user: data.session.user })
      await get().refreshProfile()
    }
    return { confirmedImmediately: data.session !== null }
  },

  signOut: async () => {
    const userId = get().user?.id
    if (userId) {
      await supabase.from('profiles').update({ status: 'offline' }).eq('id', userId)
    }
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },
}))
