import { db } from './db'
import type { Data } from './types'

/**
 * Optional local demo data. The dataset file (src/data/dataset-2024.json) is kept out of the
 * repository; when it is absent — e.g. on Vercel — the app starts empty and data is added by
 * staff or loaded with Settings → Restore backup.
 */
const local = import.meta.glob<Data>('./data/dataset-2024.json', { eager: true, import: 'default' })
export const DEMO_DATA: Data | undefined = Object.values(local)[0]

export async function seedIfEmpty() {
  if (!DEMO_DATA || (await db.packages.count()) > 0) return
  const demo = DEMO_DATA
  await db.transaction('rw', db.tables, async () => {
    await db.packages.bulkAdd(demo.packages)
    await db.customers.bulkAdd(demo.customers)
    await db.bookings.bulkAdd(demo.bookings)
    await db.visas.bulkAdd(demo.visas)
    await db.passports.bulkAdd(demo.passports)
    await db.tickets.bulkAdd(demo.tickets)
  })
}
