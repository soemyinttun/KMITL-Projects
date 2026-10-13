/**
 * One sync pass: upload local changes, then download changes from other devices.
 *
 * Conflict rule: the last change to reach the cloud wins. A downloaded record never overwrites a
 * local record that still has an unsent change; that local change is uploaded on the next pass.
 */
import { db, table } from '../db'
import { TABLES, type TableName } from '../types'
import type { Cursor, RemoteStore } from './remote'

const PUSH_BATCH = 500
const PULL_PAGE = 1000
/**
 * Each download starts this far before the last position seen, so a change saved in the cloud a
 * moment late (a slow transaction) is still picked up. Re-applying a row is harmless.
 */
const OVERLAP_MS = 60_000

const cursorKey = (t: TableName) => `cursor:${t}`

function rewind(c: Cursor): Cursor | null {
  const ms = Date.parse(c.updatedAt.replace(/(\.\d{3})\d+/, '$1'))
  return Number.isNaN(ms) ? null : { updatedAt: new Date(ms - OVERLAP_MS).toISOString(), id: '' }
}

async function push(remote: RemoteStore, t: TableName): Promise<number> {
  const dirty = await table(t).where('_dirty').equals(1).toArray()
  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const batch = dirty.slice(i, i + PUSH_BATCH)
    await remote.push(t, batch.map(({ _dirty, _rev, ...row }) => row))
    // Mark as synced only if the record was not edited again while uploading.
    await db.transaction('rw', table(t), async () => {
      const now = await table(t).bulkGet(batch.map((r) => r.id))
      const done = now.filter((cur, j) => cur && cur._rev === batch[j]!._rev).map((cur) => ({ ...cur!, _dirty: 0 as const }))
      await table(t).bulkPut(done)
    })
  }
  return dirty.length
}

async function pull(remote: RemoteStore, t: TableName): Promise<number> {
  const saved = (await db.meta.get(cursorKey(t)))?.value as Cursor | undefined
  let after = saved ? rewind(saved) : null
  let last: Cursor | undefined
  let applied = 0
  for (;;) {
    const rows = await remote.pullSince(t, after, PULL_PAGE)
    if (!rows.length) break
    await db.transaction('rw', table(t), async () => {
      const local = await table(t).bulkGet(rows.map((r) => r.id))
      const writes = rows.flatMap((r, i) => {
        const cur = local[i]
        if (cur?._dirty) return [] // keep the unsent local change
        return [{ ...r, _dirty: 0 as const, _rev: cur?._rev ?? 0 }]
      })
      await table(t).bulkPut(writes as never[])
      applied += writes.length
    })
    const tail = rows[rows.length - 1]!
    last = { updatedAt: tail.updatedAt, id: tail.id }
    after = last
    if (rows.length < PULL_PAGE) break
  }
  if (last && (!saved || last.updatedAt >= saved.updatedAt)) await db.meta.put({ key: cursorKey(t), value: last })
  return applied
}

export async function syncOnce(remote: RemoteStore): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0, pulled = 0
  for (const t of TABLES) pushed += await push(remote, t) // parents first (customers, packages)
  for (const t of TABLES) pulled += await pull(remote, t)
  return { pushed, pulled }
}

/** Forget download positions (after sign-out the next user downloads everything again). */
export async function resetCursors() {
  await db.meta.bulkDelete(TABLES.map(cursorKey))
}
