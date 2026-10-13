/**
 * Email links from Supabase (invite, password reset) come back to the app with details in the
 * address after '#'. Supabase signs the user in from a valid link by itself; this reads what kind
 * of link it was (so the app can ask for a new password) and turns link errors into plain words.
 */
export interface AuthRedirect {
  /** 'invite' or 'recovery' links need the user to choose a password. */
  kind: 'invite' | 'recovery' | 'signup' | 'magiclink' | null
  error: string | null
}

const MESSAGES: Record<string, string> = {
  otp_expired: 'This email link has expired or was already used. Ask your admin to send a new invite, or use "Forgot password?" below.',
  access_denied: 'This email link could not be used. Ask your admin to send a new one, or use "Forgot password?" below.',
}

export function readAuthRedirect(hash: string): AuthRedirect {
  const raw = hash.replace(/^#\/?/, '')
  if (!/(^|&)(access_token|error|error_code)=/.test(raw)) return { kind: null, error: null }
  const p = new URLSearchParams(raw)
  const code = p.get('error_code') ?? p.get('error')
  if (code) return { kind: null, error: MESSAGES[code] ?? p.get('error_description') ?? 'This email link could not be used.' }
  const type = p.get('type')
  const kind = type === 'invite' || type === 'recovery' || type === 'signup' || type === 'magiclink' ? type : null
  return { kind, error: null }
}
