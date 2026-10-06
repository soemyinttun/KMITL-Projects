import { describe, expect, it } from 'vitest'
import { buildSales, pctDelta, rangeFor, sumBy, totals } from './analytics'
import type { Data } from './types'

const data: Data = {
  customers: [{ id: 1, name: 'A', phone: '', township: 'Yangon', passportExpiry: '2030-01-01' }],
  packages: [{ id: 'BT7', name: 'Bhutan 7-Day', country: 'Bhutan', days: 7, price: 1000, cost: 800 }],
  bookings: [
    { id: 1, customerId: 1, packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 2, status: 'confirmed', createdAt: '2026-01-01' },
    { id: 2, customerId: 1, packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 5, status: 'cancelled', createdAt: '2026-01-01' },
    { id: 3, customerId: 1, packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 5, status: 'enquiry', createdAt: '2026-01-01' },
  ],
  visas: [
    { id: 1, customerId: 1, kind: 'India', stage: 'Approved', appliedAt: '2026-01-01', fee: 100, cost: 60 },
    { id: 2, customerId: 1, kind: 'India', stage: 'Documents', appliedAt: '2026-01-01', fee: 100, cost: 60 },
  ],
  passports: [],
  tickets: [{ id: 1, customerId: 1, direction: 'Outbound', from: 'Yangon', to: 'Paro', airline: 'x', date: '2026-02-01', fare: 500, commission: 40 }],
}

describe('analytics', () => {
  const sales = buildSales(data)
  it('counts only confirmed/completed bookings and finished visas', () => {
    expect(sales.map((s) => s.service).sort()).toEqual(['Air ticket', 'Package', 'Visa'])
  })
  it('computes package revenue and margin by pax', () => {
    const p = sales.find((s) => s.service === 'Package')!
    expect(p.revenue).toBe(2000)
    expect(p.margin).toBe(400)
  })
  it('maps outbound ticket to Bhutan', () => {
    expect(sales.find((s) => s.service === 'Air ticket')!.country).toBe('Bhutan')
  })
  it('aggregates and totals', () => {
    expect(totals(sales).revenue).toBe(2600)
    expect(sumBy(sales, (s) => s.service)[0].key).toBe('Package')
  })
  it('pctDelta handles zero base', () => {
    expect(pctDelta(10, 0)).toBe(100)
    expect(pctDelta(150, 100)).toBe(50)
  })
  it('previous range is contiguous with current', () => {
    const r = rangeFor('30d', new Date('2026-06-30'))
    expect(r.prev.to).toBe(r.from)
  })
})
