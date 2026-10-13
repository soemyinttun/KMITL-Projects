/** Admin-only cloud calls. The database refuses them for anyone who is not an admin. */
import { supabase } from '../sync/supabase'
import type { TableName } from '../types'
import type { Role } from './AuthProvider'

export interface Profile { id: string; email: string; display_name: string | null; role: Role; created_at: string }
export interface ImportEntry { id: string; imported_at: string; file_name: string; mode: 'add' | 'replace'; counts: Record<TableName, number>; profiles: { email: string } | null }

const client = () => {
  if (!supabase) throw new Error('Cloud database is not set up.')
  return supabase
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await client().from('profiles').select('*').order('created_at')
  if (error) throw new Error(error.message)
  return data as Profile[]
}

export async function setRole(id: string, role: Role) {
  const { error } = await client().from('profiles').update({ role }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function logImport(fileName: string, mode: 'add' | 'replace', counts: Record<TableName, number>) {
  const { error } = await client().from('import_log').insert({ file_name: fileName, mode, counts })
  if (error) throw new Error(error.message)
}

export async function listImports(): Promise<ImportEntry[]> {
  const { data, error } = await client().from('import_log').select('*, profiles(email)').order('imported_at', { ascending: false }).limit(20)
  if (error) throw new Error(error.message)
  return data as ImportEntry[]
}
