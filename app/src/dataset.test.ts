import { describe, expect, it } from 'vitest'
import { buildSales, monthKey, sumBy, totals } from './analytics'
import { DEMO_DATA as d } from './seed'
import summaryCsv from '../../docs/dataset-2024/monthly_summary.csv?raw'

const PEAK = ['04', '05', '09', '10', '11', '12']
const sales = buildSales(d)
const profitOf = (pred: (s: (typeof sales)[number]) => boolean) => totals(sales.filter(pred)).margin
const wonBookings = d.bookings.filter((b) => b.status === 'completed' || b.status === 'confirmed')
const countPkg = (id: string) => wonBookings.filter((b) => b.packageId === id).length

describe('2024 demo dataset', () => {
  it('total profit is exactly 15,302,000 Ks', () => {
    expect(totals(sales).margin).toBe(15_302_000)
  })

  it('every sale falls in 2024', () => {
    expect(sales.every((s) => s.date.startsWith('2024-'))).toBe(true)
  })

  it('peak months (Apr, May, Sep–Dec) hold ≥ 75% of profit and each beats every off-peak month', () => {
    const byMonth = sumBy(sales, (s) => monthKey(s.date).slice(5))
    const peak = byMonth.filter((m) => PEAK.includes(m.key))
    const off = byMonth.filter((m) => !PEAK.includes(m.key))
    expect(peak.reduce((s, m) => s + m.margin, 0) / 15_302_000).toBeGreaterThanOrEqual(0.75)
    expect(Math.min(...peak.map((m) => m.margin))).toBeGreaterThan(Math.max(...off.map((m) => m.margin)))
  })

  it('visa is about 3% of profit', () => {
    const share = profitOf((s) => s.service === 'Visa') / 15_302_000
    expect(share).toBeGreaterThanOrEqual(0.02)
    expect(share).toBeLessThanOrEqual(0.04)
  })

  it('India trip popularity: 8-day and 12-day > 5-day > 15-day; exactly 2 Thailand trips; no Bhutan', () => {
    expect(Math.min(countPkg('IN8'), countPkg('IN12'))).toBeGreaterThan(countPkg('IN5'))
    expect(countPkg('IN5')).toBeGreaterThan(countPkg('IN15'))
    expect(countPkg('IN15')).toBeGreaterThan(0)
    expect(countPkg('TH5')).toBe(2)
    expect(sales.some((s) => s.country === 'Bhutan')).toBe(false)
  })

  it('origins rank Yangon > Rakhine > Mandalay > Taunggyi > Pyay: customers and both heatmap views', () => {
    const order = ['Yangon', 'Rakhine', 'Mandalay', 'Taunggyi', 'Pyay']
    const town = new Map(d.customers.map((c) => [c.id!, c.township]))
    const counts = (rows: { customerId: number }[]) => order.map((o) => rows.filter((r) => town.get(r.customerId) === o).length)
    const strictlyDescending = (xs: number[]) => xs.every((n, i) => i === 0 || xs[i - 1]! > n)
    expect(strictlyDescending(order.map((o) => d.customers.filter((c) => c.township === o).length))).toBe(true)
    expect(strictlyDescending(counts(wonBookings)), 'Heatmaps → Origins → Bookings').toBe(true)
    expect(strictlyDescending(counts(d.bookings.filter((b) => b.status !== 'cancelled'))), 'Heatmaps → Origins → Enquiries').toBe(true)
    expect(new Set(d.customers.map((c) => c.township))).toEqual(new Set(order))
  })

  it('Bodh Gaya is among the hottest destinations when trips count at every itinerary stop', () => {
    // Bodh Gaya and Rajgir are on every India itinerary, so they tie for the top.
    const pkg = new Map(d.packages.map((p) => [p.id, p]))
    const heat = new Map<string, number>()
    for (const b of wonBookings) for (const stop of pkg.get(b.packageId)!.stops) heat.set(stop, (heat.get(stop) ?? 0) + 1)
    expect(heat.get('Bodh Gaya')).toBe(Math.max(...heat.values()))
    expect(heat.get('Bangkok')).toBe(2)
  })

  it('every itinerary stop and origin is a known map place', async () => {
    const { placeByName } = await import('./types')
    for (const p of d.packages) for (const stop of p.stops) expect(placeByName(stop), stop).toBeDefined()
    for (const c of d.customers) expect(placeByName(c.township), c.township).toBeDefined()
  })

  it('monthly_summary.csv in docs reconciles with the app’s own totals', () => {
    const csv = summaryCsv.trim().split('\n')
    const head = csv[0]!.split(',')
    const rows = csv.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [head[i]!, v])))
    const total = rows.find((r) => r['month'] === 'TOTAL')!
    expect(Number(total['total_profit'])).toBe(totals(sales).margin)
    expect(Number(total['total_revenue'])).toBe(totals(sales).revenue)
    for (const r of rows.filter((r) => r['month'] !== 'TOTAL')) {
      const mm = String(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(r['month']!) + 1).padStart(2, '0')
      expect(Number(r['total_profit']), r['month']).toBe(profitOf((s) => s.date.slice(5, 7) === mm))
    }
  })
})
