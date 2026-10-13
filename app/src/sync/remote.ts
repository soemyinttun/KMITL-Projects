import type { TableName } from '../types'

/** Position in a table's change feed: rows are ordered by (updatedAt, id). */
export interface Cursor { updatedAt: string; id: string }

/** An app-shaped record as stored in the cloud (updatedAt is the server's time). */
export type RemoteRow = Record<string, unknown> & { id: string; updatedAt: string }

/** The cloud side of sync. Implemented by supabaseRemote.ts; tests use an in-memory fake. */
export interface RemoteStore {
  /** Insert-or-update app-shaped records (without local _dirty/_rev fields). */
  push(table: TableName, rows: Record<string, unknown>[]): Promise<void>
  /**
   * Up to `limit` rows changed after `after`, oldest first: strictly after (updatedAt, id), or at
   * or after updatedAt when `after.id` is '' (a rewound cursor). From the start when null.
   */
  pullSince(table: TableName, after: Cursor | null, limit: number): Promise<RemoteRow[]>
  /** Calls `onChange` when another device changes a table. Returns an unsubscribe function. */
  subscribe(onChange: (table: TableName) => void): () => void
}
