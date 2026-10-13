/**
 * Sign-in state and roles. Roles live in the cloud `profiles` table (pending / staff / admin); the
 * database enforces them, the app only uses them to show or hide screens.
 *
 * Local-only mode (no Supabase configured): a single user with full access, no sign-in.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { clearDevice } from '../db'
import { pendingCount } from '../store'
import { requestSync, startSync, stopSync } from '../sync/controller'
import { supabase } from '../sync/supabase'
import { supabaseRemote } from '../sync/supabaseRemote'

export type Role = 'pending' | 'staff' | 'admin'
interface AuthCtx {
  mode: 'local' | 'cloud'
  status: 'loading' | 'signedOut' | 'pending' | 'ready'
  email?: string
  role?: Role
  signIn: (email: string, password: string) => Promise<string | null>
  /** Returns false if the user cancelled. */
  signOut: () => Promise<boolean>
  refreshRole: () => Promise<void>
}
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)
export const useAuth = () => useContext(Ctx)

const LAST_USER = 'travelops.lastUser'
const roleKey = (uid: string) => `travelops.role.${uid}`

async function loadRole(uid: string): Promise<Role> {
  const { data, error } = await supabase!.from('profiles').select('role').eq('id', uid).maybeSingle()
  if (!error && data) {
    localStorage.setItem(roleKey(uid), data.role)
    return data.role as Role
  }
  // Offline: use the role remembered from the last successful check.
  return (localStorage.getItem(roleKey(uid)) as Role | null) ?? 'pending'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [role, setRole] = useState<Role>()

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  const refreshRole = useCallback(async () => { if (uid) setRole(await loadRole(uid)) }, [uid])
  useEffect(() => { setRole(undefined); void refreshRole() }, [refreshRole])

  // Start syncing once an approved user is signed in. A different user on this device first
  // gets a clean local database, so nobody sees or uploads the previous user's records.
  useEffect(() => {
    if (!supabase || !uid || (role !== 'staff' && role !== 'admin')) return
    let cancelled = false
    void (async () => {
      if (localStorage.getItem(LAST_USER) !== uid) { await clearDevice(); localStorage.setItem(LAST_USER, uid) }
      if (!cancelled) startSync(supabaseRemote(supabase!))
    })()
    return () => { cancelled = true; stopSync() }
  }, [uid, role])

  const value: AuthCtx = supabase
    ? {
        mode: 'cloud',
        status: session === undefined || (session && !role) ? 'loading' : !session ? 'signedOut' : role === 'pending' ? 'pending' : 'ready',
        ...(session?.user.email ? { email: session.user.email } : {}),
        ...(role ? { role } : {}),
        async signIn(email, password) {
          const { error } = await supabase!.auth.signInWithPassword({ email, password })
          return error ? error.message : null
        },
        async signOut() {
          await requestSync()
          const waiting = await pendingCount()
          if (waiting && !confirm(`${waiting} change(s) on this device are not uploaded yet and will be lost. Sign out anyway?`)) return false
          stopSync()
          await supabase!.auth.signOut()
          await clearDevice()
          localStorage.removeItem(LAST_USER)
          return true
        },
        refreshRole,
      }
    : { mode: 'local', status: 'ready', role: 'admin', signIn: async () => null, signOut: async () => true, refreshRole: async () => {} }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
