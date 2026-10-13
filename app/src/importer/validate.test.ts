import { describe, expect, it } from 'vitest'
import { checkBackup, withFreshIds } from './validate'

// A backup in the old numeric-id format (amounts in kyat).
const oldBackup = () => ({
  customers: [{ id: 1, name: 'Daw Su', phone: '09123', township: 'Yangon', passportExpiry: '2030-01-01' }],
  packages: [{ id: 'IN8', name: 'India 8-Day', country: 'India', days: 8, price: 2_800_000, cost: 2_632_000, stops: ['Bodh Gaya'] }],
  bookings: [{ id: 7, customerId: 1, packageId: 'IN8', destination: 'Bodh Gaya', departDate: '2024-10-20', pax: 2, status: 'completed', createdAt: '2024-10-01' }],
  visas: [{ id: 3, customerId: 1, kind: 'India', stage: 'Delivered', appliedAt: '2024-09-01', decidedAt: '2024-09-05', fee: 160_000, cost: 145_000 }],
  passports: [],
  tickets: [{ id: 9, customerId: 1, direction: 'Outbound', from: 'Yangon', to: 'Bodh Gaya', airline: 'MAI', date: '2024-10-02', fare: 900_000, commission: 40_000 }],
})
const UUID = /^[0-9a-f-]{36}$/

describe('checkBackup', () => {
  it('converts an old numeric-id backup to UUIDs and keeps every reference', () => {
    const r = checkBackup(oldBackup())
    expect(r.errors).toEqual([])
    const d = r.data!
    const cid = d.customers[0]!.id
    expect(cid).toMatch(UUID)
    expect(d.bookings[0]!.customerId).toBe(cid)
    expect(d.visas[0]!.customerId).toBe(cid)
    expect(d.tickets[0]!.customerId).toBe(cid)
    expect(d.bookings[0]!.packageId).toBe('IN8')
    expect(d.bookings[0]!.id).toMatch(UUID)
    expect(r.counts).toEqual({ customers: 1, packages: 1, bookings: 1, visas: 1, passports: 0, tickets: 1 })
  })

  it('keeps UUIDs from a current backup so re-importing updates the same records', () => {
    const first = checkBackup(oldBackup()).data!
    const again = checkBackup(JSON.parse(JSON.stringify(first))).data!
    expect(again.customers[0]!.id).toBe(first.customers[0]!.id)
    expect(again.bookings[0]!.id).toBe(first.bookings[0]!.id)
  })

  it.each([
    ['money that is not a whole kyat amount', (b: ReturnType<typeof oldBackup>) => { b.packages[0]!.price = 12.5 }, /whole number of kyat/],
    ['negative money', (b: ReturnType<typeof oldBackup>) => { b.tickets[0]!.fare = -1 }, /whole number of kyat/],
    ['a bad date', (b: ReturnType<typeof oldBackup>) => { b.bookings[0]!.departDate = '20/10/2024' }, /date like 2024-03-31/],
    ['an unknown booking status', (b: ReturnType<typeof oldBackup>) => { (b.bookings[0] as { status: string }).status = 'paid' }, /must be one of enquiry/],
    ['an unknown visa stage', (b: ReturnType<typeof oldBackup>) => { b.visas[0]!.stage = 'Lost' }, /must be one of Enquiry/],
    ['a booking for a missing customer', (b: ReturnType<typeof oldBackup>) => { b.bookings[0]!.customerId = 99 }, /does not match any customer/],
    ['a booking for a missing package', (b: ReturnType<typeof oldBackup>) => { b.bookings[0]!.packageId = 'XX' }, /does not match any package/],
    ['a duplicate id', (b: ReturnType<typeof oldBackup>) => { b.customers.push({ ...b.customers[0]! }) }, /used twice/],
    ['a missing name', (b: ReturnType<typeof oldBackup>) => { b.customers[0]!.name = '' }, /"name" is missing/],
  ])('rejects %s', (_label, breakIt, message) => {
    const b = oldBackup()
    breakIt(b)
    const r = checkBackup(b)
    expect(r.data).toBeNull()
    expect(r.errors.join('\n')).toMatch(message)
  })

  it('rejects files that are not backups', () => {
    expect(checkBackup('hello').errors[0]).toMatch(/not a Travel Ops backup/)
    expect(checkBackup({ foo: [] }).errors[0]).toMatch(/none of the expected lists/)
  })

  it('warns (but allows) a missing list and a package that costs more than its price', () => {
    const b: Record<string, unknown> = oldBackup()
    delete b['passports']
    ;(b['packages'] as { cost: number }[])[0]!.cost = 3_000_000
    const r = checkBackup(b)
    expect(r.data).not.toBeNull()
    expect(r.warnings.join('\n')).toMatch(/No "passports" list/)
    expect(r.warnings.join('\n')).toMatch(/cost is higher than price/)
  })
})

describe('withFreshIds', () => {
  it('gives new ids to everything except packages and updates references', () => {
    const d = checkBackup(oldBackup()).data!
    const f = withFreshIds(d)
    expect(f.customers[0]!.id).not.toBe(d.customers[0]!.id)
    expect(f.bookings[0]!.id).not.toBe(d.bookings[0]!.id)
    expect(f.bookings[0]!.customerId).toBe(f.customers[0]!.id)
    expect(f.tickets[0]!.customerId).toBe(f.customers[0]!.id)
    expect(f.packages[0]!.id).toBe('IN8')
  })
})
