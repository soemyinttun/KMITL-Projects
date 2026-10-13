/**
 * Supabase connection. The URL and anon key are public by design: what each user may read or
 * change is enforced in the database by Row Level Security (supabase/migrations/0001_init.sql).
 * Never put the service-role key in the app.
 *
 * When the two variables are not set, the app runs in local-only mode (no logins, no sync).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readAuthRedirect } from '../auth/redirect'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** What an email link put in the address. Read before Supabase clears it. */
export const authRedirect = readAuthRedirect(window.location.hash)
// A failed link leaves error details in the address; send the app back to its start page.
if (authRedirect.error) window.history.replaceState(null, '', `${window.location.pathname}#/`)

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const cloudEnabled = supabase !== null
