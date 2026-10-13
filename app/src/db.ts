import Dexie, { type Table } from 'dexie'
import { TABLES, type RowOf, type TableName } from './types'

/**
 * Local-only bookkeeping kept with each row (never sent to the cloud):
 * _dirty = 1 while the row has a change that is not yet synced; _rev counts local edits so a
 * sync can tell whether the row changed again while it was being uploaded.
 */
export type Local<T> = T & { _dirty: 0 | 1; _rev: number }

export class AppDB extends Dexie {
  customers!: Table<Local<RowOf<'customers'>>, string>
  packages!: Table<Local<RowOf<'packages'>>, string>
  bookings!: Table<Local<RowOf<'bookings'>>, string>
  visas!: Table<Local<RowOf<'visas'>>, string>
  passports!: Table<Local<RowOf<'passports'>>, string>
  tickets!: Table<Local<RowOf<'tickets'>>, string>
  /** Sync cursors and other small settings. */
  meta!: Table<{ key: string; value: unknown }, string>
  constructor() {
    super('ssm-travel-ops')
    this.version(1).stores({
      customers: 'id,name,_dirty',
      packages: 'id,country,days,_dirty',
      bookings: 'id,customerId,packageId,departDate,status,_dirty',
      visas: 'id,customerId,stage,_dirty',
      passports: 'id,customerId,stage,_dirty',
      tickets: 'id,customerId,date,_dirty',
      meta: 'key',
    })
  }
}
export const db = new AppDB()

export function table<T extends TableName>(name: T): Table<Local<RowOf<T>>, string> {
  return db[name] as unknown as Table<Local<RowOf<T>>, string>
}

/** Removes every record and sync cursor from this device (used on sign-out and "erase"). */
export async function clearDevice() {
  await Promise.all(db.tables.map((t) => t.clear()))
}

// ── Data from the previous app version ─────────────────────────────────────

/** IndexedDB name used by app versions before cloud sync (numeric ids; v1 stored USD). */
export const LEGACY_DB = 'himalaya-travel-ops'

/** MMK-per-USD rate the user had set (stored with the UI filters), or the old default. */
function savedFxRate(): number {
  try {
    const fx = Number(JSON.parse(localStorage.getItem('travelops.filters') ?? '{}').fx)
    return fx > 0 ? fx : 2100
  } catch {
    return 2100
  }
}

/**
 * Reads the previous version's database, if this device has one, as a backup-shaped object
 * (numeric ids; amounts converted to kyat). Returns null when there is none.
 */
export async function readLegacyData(): Promise<Record<string, unknown[]> | null> {
  if (!(await Dexie.exists(LEGACY_DB))) return null
  const old = new Dexie(LEGACY_DB)
  try {
    await old.open()
    const out: Record<string, unknown[]> = {}
    for (const t of TABLES) out[t] = old.tables.some((x) => x.name === t) ? await old.table(t).toArray() : []
    if (old.verno < 2) {
      // v1 stored money in USD; v2 and later store kyat.
      const ks = (usd: unknown) => Math.round(Number(usd) * savedFxRate())
      for (const p of out['packages'] as Record<string, unknown>[]) { p['price'] = ks(p['price']); p['cost'] = ks(p['cost']) }
      for (const t of ['visas', 'passports'])
        for (const c of out[t] as Record<string, unknown>[]) { c['fee'] = ks(c['fee']); c['cost'] = ks(c['cost']) }
      for (const x of out['tickets'] as Record<string, unknown>[]) { x['fare'] = ks(x['fare']); x['commission'] = ks(x['commission']) }
    }
    return Object.values(out).some((rows) => rows.length) ? out : null
  } finally {
    old.close()
  }
}

export async function deleteLegacyData() {
  await Dexie.delete(LEGACY_DB)
}
