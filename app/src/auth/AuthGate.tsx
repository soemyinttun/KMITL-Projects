import { useState, type FormEvent, type ReactNode } from 'react'
import { Loading, btn, btnGhost, inp } from '../components/ui'
import { useAuth } from './AuthProvider'

/** Shows the sign-in or "waiting for approval" screen until the user may use the app. */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (auth.status === 'loading') return <Loading />
  if (auth.status === 'signedOut') return <SignIn />
  if (auth.status === 'setPassword') return <ChoosePassword />
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
  const { signIn, linkError } = useAuth()
  const [forgot, setForgot] = useState(false)
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
  if (forgot) return <ForgotPassword email={email} onBack={() => setForgot(false)} />
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      {linkError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{linkError}</p>}
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>No account? Ask your admin to invite you.</span>
        <button type="button" className="text-teal-700 underline" onClick={() => setForgot(true)}>Forgot password?</button>
      </div>
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

function ForgotPassword({ email: initial, onBack }: { email: string; onBack: () => void }) {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState(initial)
  const [state, setState] = useState<{ busy?: boolean; sent?: boolean; error?: string | null }>({})
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!navigator.onLine) { setState({ error: 'You need internet to reset your password.' }); return }
    setState({ busy: true })
    const error = await sendPasswordReset(email.trim())
    setState(error ? { error } : { sent: true })
  }
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">Forgot password</h1>
      {state.sent ? (
        <p role="status" className="text-sm text-slate-700">
          If <b>{email}</b> has an account, we sent an email with a link. Open the link <b>on this phone or computer</b> and choose a new password. The link works once and expires after a while.
        </p>
      ) : (
        <form className="space-y-3" onSubmit={submit}>
          <p className="text-sm text-slate-600">Type your email. We will send you a link to choose a new password.</p>
          <label className="block text-sm">Email
            <input className={`${inp} mt-1 w-full`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {state.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
          <button className={`${btn} w-full`} disabled={state.busy}>{state.busy ? 'Sending…' : 'Send link'}</button>
        </form>
      )}
      <button className={btnGhost} onClick={onBack}>Back to sign in</button>
    </Screen>
  )
}

/** After opening an invite or password-reset link: the person chooses their password. */
function ChoosePassword() {
  const { email, setPassword } = useAuth()
  const [pw, setPw] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) { setError('Use at least 8 characters.'); return }
    if (pw !== again) { setError('The two passwords are not the same.'); return }
    setBusy(true)
    setError(await setPassword(pw))
    setBusy(false)
  }
  return (
    <Screen>
      <h1 className="text-xl font-semibold text-slate-900">Choose your password</h1>
      <p className="text-sm text-slate-600">For <b>{email}</b>. You will use it to sign in on any phone or computer.</p>
      <form className="space-y-3" onSubmit={submit}>
        <label className="block text-sm">New password
          <input className={`${inp} mt-1 w-full`} type="password" autoComplete="new-password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        <label className="block text-sm">Type it again
          <input className={`${inp} mt-1 w-full`} type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button className={`${btn} w-full`} disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </Screen>
  )
}
