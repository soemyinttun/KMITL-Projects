import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { LEGACY_DB, clearDevice, table } from './db'
import { prepareLocalData } from './seed'

/** Creates a database like the previous app version made (numeric ids). */
async function makeLegacy(version: 1 | 2) {
  const old = new Dexie(LEGACY_DB)
  old.version(version).stores({
    customers: '++id,name', packages: 'id,country,days', bookings: '++id,customerId,packageId,departDate,status',
    visas: '++id,customerId,stage', passports: '++id,customerId,stage', tickets: '++id,customerId,date',
  })
  await old.open()
  await old.table('customers').bulkAdd([{ id: 1, name: 'U Win', phone: '09', township: 'Mandalay', passportExpiry: '2031-01-01' }, { id: 2, name: 'Ma Su', phone: '', township: 'Yangon', passportExpiry: '' }])
  await old.table('packages').add({ id: 'IN8', name: 'India 8-Day', country: 'India', days: 8, price: version === 1 ? 1000 : 2_800_000, cost: version === 1 ? 900 : 2_632_000, stops: [] })
  await old.table('bookings').add({ id: 5, customerId: 2, packageId: 'IN8', destination: 'Bodh Gaya', departDate: '2024-05-01', pax: 3, status: 'completed', createdAt: '2024-04-01' })
  await old.table('tickets').add({ id: 1, customerId: 1, direction: 'Outbound', from: 'Yangon', to: 'Delhi', airline: 'AI', date: '2024-04-02', fare: version === 1 ? 300 : 1_300_000, commission: version === 1 ? 20 : 60_000 })
  old.close()
}

beforeEach(async () => { await clearDevice(); await Dexie.delete(LEGACY_DB) })

describe('moving data from the previous app version', () => {
  it('copies everything with new ids, keeps references, then removes the old database', async () => {
    await makeLegacy(2)
    await prepareLocalData()
    const customers = await table('customers').toArray()
    expect(customers.map((c) => c.name).sort()).toEqual(['Ma Su', 'U Win'])
    const su = customers.find((c) => c.name === 'Ma Su')!
    const [booking] = await table('bookings').toArray()
    expect(booking).toMatchObject({ customerId: su.id, packageId: 'IN8', pax: 3 })
    const [ticket] = await table('tickets').toArray()
    expect(ticket!.customerId).toBe(customers.find((c) => c.name === 'U Win')!.id)
    expect(ticket).toMatchObject({ fare: 1_300_000, commission: 60_000 })
    expect(await Dexie.exists(LEGACY_DB)).toBe(false)
  })

  it('converts the oldest (USD) version to kyat', async () => {
    await makeLegacy(1)
    await prepareLocalData()
    // No saved exchange rate in this test, so the old default of 2,100 Ks per USD applies.
    expect(await table('packages').get('IN8')).toMatchObject({ price: 2_100_000, cost: 1_890_000 })
    expect((await table('tickets').toArray())[0]).toMatchObject({ fare: 630_000, commission: 42_000 })
  })

  it('does nothing when this device already has data', async () => {
    await makeLegacy(2)
    await prepareLocalData()
    const before = await table('customers').count()
    await makeLegacy(2).catch(() => {}) // old database appears again
    await prepareLocalData()
    expect(await table('customers').count()).toBe(before)
  })
})
