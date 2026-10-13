import Dexie, { type Table } from 'dexie'
import type { Booking, Case, Customer, Pkg, Ticket } from './types'

/** MMK-per-USD rate the user had set before v2 (stored with the UI filters), or the old default. */
function savedFxRate(): number {
  try {
    const fx = Number(JSON.parse(localStorage.getItem('travelops.filters') ?? '{}').fx)
    return fx > 0 ? fx : 2100
  } catch {
    return 2100
  }
}

export class AppDB extends Dexie {
  customers!: Table<Customer, number>
  packages!: Table<Pkg, string>
  bookings!: Table<Booking, number>
  visas!: Table<Case, number>
  passports!: Table<Case, number>
  tickets!: Table<Ticket, number>
  constructor() {
    super('himalaya-travel-ops')
    this.version(1).stores({
      customers: '++id,name',
      packages: 'id,country,days',
      bookings: '++id,customerId,packageId,departDate,status',
      visas: '++id,customerId,stage',
      passports: '++id,customerId,stage',
      tickets: '++id,customerId,date',
    })
    // v2: money is stored in kyat instead of USD; packages gain itinerary stops.
    this.version(2).stores({}).upgrade(async (tx) => {
      const fx = savedFxRate()
      const toKs = (usd: number) => Math.round(usd * fx)
      await tx.table('packages').toCollection().modify((p: Pkg) => {
        p.price = toKs(p.price); p.cost = toKs(p.cost); p.stops ??= []
      })
      for (const t of ['visas', 'passports'])
        await tx.table(t).toCollection().modify((c: Case) => { c.fee = toKs(c.fee); c.cost = toKs(c.cost) })
      await tx.table('tickets').toCollection().modify((t: Ticket) => { t.fare = toKs(t.fare); t.commission = toKs(t.commission) })
    })
  }
}
export const db = new AppDB()

export async function resetAll() {
  await Promise.all(db.tables.map((t) => t.clear()))
}
