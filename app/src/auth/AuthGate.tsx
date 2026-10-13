import { useState, type FormEvent, type ReactNode } from 'react'
import { Loading, btn, btnGhost, inp } from '../components/ui'
import { useAuth } from './AuthProvider'

/** Shows the sign-in or "waiting for approval" screen until the user may use the app. */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.status === 'loading') return <Loading />
  if (auth.status === 'signedOut') return <SignIn />
  if (auth.status === 'pending') return <Pending />
  return <>{children}</>
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-bold text-teal-800">🏔️ SSM Travel &amp; Tours</div>
        {children}
      </div>
    </div>
  )
}

function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!navigator.onLine) { setError('You need internet to sign in the first time.'); return }
    setBusy(true)
    setError(await signIn(email.trim(), password))
    setBusy(false)
  }
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <form className="space-y-3" onSubmit={submit}>
        <label className="block text-sm">Email
          <input className={`${inp} mt-1 w-full`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">Password
          <input className={`${inp} mt-1 w-full`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button className={`${btn} w-full`} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="text-xs text-slate-500">No account? Ask your admin to invite you.</p>
    </Screen>
  )
}

function Pending() {
  const { email, refreshRole, signOut } = useAuth()
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">Waiting for approval</h1>
      <p className="text-sm text-slate-600">You are signed in as <b>{email}</b>. An admin needs to approve your account before you can see company data.</p>
      <div className="flex gap-2">
        <button className={btn} onClick={() => void refreshRole()}>Check again</button>
        <button className={btnGhost} onClick={() => void signOut()}>Sign out</button>
      </div>
    </Screen>
  )
}
