import Dexie, { type Table } from 'dexie'
import type { Booking, Case, Customer, Pkg, Ticket } from './types'

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
  }
}
export const db = new AppDB()

export async function resetAll() {
  await Promise.all(db.tables.map((t) => t.clear()))
}
