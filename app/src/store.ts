/**
 * The only way the app changes data. Every write is stamped as an unsynced local change
 * (_dirty = 1, _rev + 1) so the sync engine uploads it; deletes are soft (deleted: true) so they
 * reach the other devices too.
 */
import { db, table, type Local } from './db'
import { TABLES, type Data, type RowOf, type TableName } from './types'

type NewRow<T extends TableName> = Omit<RowOf<T>, 'id'> & { id?: string }

let writeListener: () => void = () => {}
/** Called after every successful write (the sync engine uses it to schedule an upload). */
export function onLocalWrite(listener: () => void) { writeListener = listener }

const now = () => new Date().toISOString()
function stamp<T extends TableName>(row: RowOf<T>, prev?: Local<RowOf<T>>): Local<RowOf<T>> {
  return { ...row, updatedAt: now(), _dirty: 1, _rev: (prev?._rev ?? 0) + 1 } as unknown as Local<RowOf<T>>
}

export async function create<T extends TableName>(t: T, row: NewRow<T>): Promise<string> {
  const id = row.id ?? crypto.randomUUID()
  await table(t).add(stamp<T>({ ...row, id } as RowOf<T>))
  writeListener()
  return id
}

export async function patch<T extends TableName>(t: T, id: string, changes: Partial<RowOf<T>>) {
  await db.transaction('rw', table(t), async () => {
    const cur = await table(t).get(id)
    if (!cur) throw new Error(`No ${t} record with id ${id}`)
    const next = { ...cur, ...changes } as RowOf<T>
    // Optional fields set to undefined are removed so they sync as "empty".
    for (const [k, v] of Object.entries(changes)) if (v === undefined) delete (next as unknown as Record<string, unknown>)[k]
    await table(t).put(stamp<T>(next, cur))
  })
  writeListener()
}

export function remove(t: TableName, id: string) {
  return patch(t, id, { deleted: true } as Partial<RowOf<typeof t>>)
}

/** Adds (or, for an existing id, overwrites) records from an import. */
export async function addMany(data: Data) {
  await db.transaction('rw', TABLES.map((t) => table(t)), async () => {
    for (const t of TABLES) {
      const rows = data[t] as RowOf<typeof t>[]
      const existing = await table(t).bulkGet(rows.map((r) => r.id))
      await table(t).bulkPut(rows.map((r, i) => stamp(r, existing[i])))
    }
  })
  writeListener()
}

/**
 * Makes the data equal to `data`: records not in it are soft-deleted (so the deletion syncs),
 * records in it are written. Used by "Replace all data" and the local demo reset.
 */
export async function replaceAll(data: Data) {
  await db.transaction('rw', TABLES.map((t) => table(t)), async () => {
    for (const t of TABLES) {
      const rows = data[t] as RowOf<typeof t>[]
      const keep = new Set(rows.map((r) => r.id))
      const current = await table(t).toArray()
      const byId = new Map(current.map((r) => [r.id, r]))
      const gone = current.filter((r) => !keep.has(r.id) && !r.deleted).map((r) => stamp({ ...r, deleted: true }, r))
      await table(t).bulkPut([...gone, ...rows.map((r) => stamp({ ...r, deleted: false }, byId.get(r.id)))])
    }
  })
  writeListener()
}

/** Number of records with changes not yet uploaded. */
export async function pendingCount(): Promise<number> {
  const n = await Promise.all(TABLES.map((t) => table(t).where('_dirty').equals(1).count()))
  return n.reduce((a, b) => a + b, 0)
}

/** Current (not deleted) data without local bookkeeping fields — for backups and analytics. */
export async function snapshot(): Promise<Data> {
  const out = {} as Record<TableName, unknown[]>
  for (const t of TABLES) out[t] = (await table(t).toArray()).filter((r) => !r.deleted).map(({ _dirty, _rev, ...r }) => r)
  return out as unknown as Data
}
