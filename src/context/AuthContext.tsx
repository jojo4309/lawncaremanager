import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types'

interface TeamMembership {
  ownerProfileId: string
  role: 'admin' | 'member'
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** The profile_id to use for all data queries — own ID or owner's ID if team member */
  profileId: string | null
  loading: boolean
  configured: boolean
  isTeamMember: boolean
  teamMembership: TeamMembership | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, data: Partial<Profile>) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [teamMembership, setTeamMembership] = useState<TeamMembership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) initUser(session.user)
        else setLoading(false)
      })
      .catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) initUser(session.user)
      else {
        setProfile(null)
        setProfileId(null)
        setTeamMembership(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function initUser(u: User) {
    try {
      // 1. Check for a pending invite by email — auto-accept it
      const { data: pendingInvite } = await supabase
        .from('team_members')
        .select('id, owner_profile_id')
        .eq('email', u.email ?? '')
        .eq('status', 'pending')
        .maybeSingle()

      if (pendingInvite) {
        await supabase.from('team_members').update({
          member_user_id: u.id,
          status: 'active',
          joined_at: new Date().toISOString(),
        }).eq('id', pendingInvite.id)
      }

      // 2. Check for an active team membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('owner_profile_id, role')
        .eq('member_user_id', u.id)
        .eq('status', 'active')
        .maybeSingle()

      if (membership) {
        // Team member — use owner's profile
        setTeamMembership({ ownerProfileId: membership.owner_profile_id, role: membership.role })
        setProfileId(membership.owner_profile_id)
        await loadProfile(membership.owner_profile_id)
      } else {
        // Owner / standalone account
        setTeamMembership(null)
        setProfileId(u.id)
        await loadProfile(u.id)
      }
    } catch {
      setProfileId(u.id)
      setLoading(false)
    }
  }

  async function loadProfile(id: string) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      setProfile(data)
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (e) { return { error: e as Error } }
  }

  async function signUp(email: string, password: string, profileData: Partial<Profile>) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (!error && data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: profileData.full_name ?? '',
          business_name: profileData.business_name ?? '',
          phone: profileData.phone,
        })
      }
      return { error }
    } catch (e) { return { error: e as Error } }
  }

  async function signOut() {
    await supabase.auth.signOut().catch(() => {})
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!profileId) return
    try {
      const { data: updated } = await supabase
        .from('profiles').update(data).eq('id', profileId).select().single()
      if (updated) setProfile(updated)
    } catch { /* non-fatal */ }
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, profileId, loading,
      configured: supabaseConfigured,
      isTeamMember: !!teamMembership,
      teamMembership,
      signIn, signUp, signOut, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
