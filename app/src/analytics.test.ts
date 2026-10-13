import { describe, expect, it } from 'vitest'
import { buildSales, monthsFor, pctDelta, rangeFor, sumBy, totals } from './analytics'
import type { Data } from './types'

// Amounts in kyat.
const data: Data = {
  customers: [{ id: 'c1', name: 'A', phone: '', township: 'Yangon', passportExpiry: '2030-01-01' }],
  packages: [{ id: 'BT7', name: 'Bhutan 7-Day', country: 'Bhutan', days: 7, price: 2_800_000, cost: 2_632_000, stops: ['Paro', 'Thimphu'] }],
  bookings: [
    { id: 'r1', customerId: 'c1', packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 2, status: 'confirmed', createdAt: '2026-01-01' },
    { id: 'r2', customerId: 'c1', packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 5, status: 'cancelled', createdAt: '2026-01-01' },
    { id: 'r3', customerId: 'c1', packageId: 'BT7', destination: 'Paro', departDate: '2026-01-01', pax: 5, status: 'enquiry', createdAt: '2026-01-01' },
  ],
  visas: [
    { id: 'r1', customerId: 'c1', kind: 'India', stage: 'Approved', appliedAt: '2026-01-01', fee: 160_000, cost: 145_000 },
    { id: 'r2', customerId: 'c1', kind: 'India', stage: 'Documents', appliedAt: '2026-01-01', fee: 160_000, cost: 145_000 },
  ],
  passports: [],
  tickets: [{ id: 'r1', customerId: 'c1', direction: 'Outbound', from: 'Yangon', to: 'Paro', airline: 'x', date: '2026-02-01', fare: 900_000, commission: 40_000 }],
}

describe('analytics', () => {
  const sales = buildSales(data)
  it('counts only confirmed/completed bookings and finished visas', () => {
    expect(sales.map((s) => s.service).sort()).toEqual(['Air ticket', 'Package', 'Visa'])
  })
  it('computes package revenue and margin by pax', () => {
    const p = sales.find((s) => s.service === 'Package')!
    expect(p.revenue).toBe(5_600_000) // 2 pax × 2,800,000
    expect(p.margin).toBe(336_000) // 2 × (2,800,000 − 2,632,000)
  })
  it('maps outbound ticket to Bhutan', () => {
    expect(sales.find((s) => s.service === 'Air ticket')!.country).toBe('Bhutan')
  })
  it('aggregates and totals', () => {
    expect(totals(sales).revenue).toBe(6_660_000) // 5,600,000 + 160,000 + 900,000
    expect(totals(sales).margin).toBe(391_000) // 336,000 + 15,000 + 40,000
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
  it('calendar-year preset covers Jan 1 – Dec 31, previous period is the prior year', () => {
    const r = rangeFor('y2024', new Date('2026-10-13'))
    expect([r.from, r.to]).toEqual(['2024-01-01', '2024-12-31'])
    expect([r.prev.from, r.prev.to]).toEqual(['2023-01-01', '2023-12-31'])
  })
  it('monthsFor gives Jan–Dec for a year preset and the last 12 months otherwise', () => {
    expect(monthsFor('y2024')).toEqual(['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'])
    const rolling = monthsFor('12m', new Date(2026, 9, 13))
    expect([rolling[0], rolling[11], rolling.length]).toEqual(['2025-11', '2026-10', 12])
  })
})
