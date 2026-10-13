import type { SupabaseClient } from '@supabase/supabase-js'
import { TABLES, type TableName } from '../types'
import { fromDb, toDb } from './columns'
import type { Cursor, RemoteRow, RemoteStore } from './remote'

/** PostgREST filter value with quoting (timestamps contain ':' and '+'). */
const q = (v: string) => `"${v.replace(/"/g, '\\"')}"`

export function supabaseRemote(client: SupabaseClient): RemoteStore {
  return {
    async push(t, rows) {
      const { error } = await client.from(t).upsert(rows.map((r) => toDb(t, r)), { onConflict: 'id' })
      if (error) throw new Error(`Upload to ${t} failed: ${error.message}`)
    },

    async pullSince(t, after: Cursor | null, limit) {
      let query = client.from(t).select('*').order('updated_at').order('id').limit(limit)
      // An empty id means "from this time on" (a rewound cursor); ids are UUIDs in most tables.
      if (after?.id === '') query = query.gte('updated_at', after.updatedAt)
      else if (after) query = query.or(`updated_at.gt.${q(after.updatedAt)},and(updated_at.eq.${q(after.updatedAt)},id.gt.${q(after.id)})`)
      const { data, error } = await query
      if (error) throw new Error(`Download from ${t} failed: ${error.message}`)
      return (data ?? []).map((r) => fromDb(t, r) as RemoteRow)
    },

    subscribe(onChange) {
      const channel = client.channel('travel-ops-changes')
      for (const t of TABLES)
        channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => onChange(t as TableName))
      channel.subscribe()
      return () => { void client.removeChannel(channel) }
    },
  }
}
