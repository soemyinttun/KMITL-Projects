import type { Country, Data, Service } from './types'
import { placeByName } from './types'

export interface Sale {
  date: string; service: Service; label: string; revenue: number; margin: number
  country?: Country; dest?: string; origin?: string; days?: number
}

const countryOfPlace = (n: string): Country | undefined => {
  const p = placeByName(n)
  return p && p.country !== 'Myanmar' ? p.country : undefined
}

const DONE = ['Approved', 'Delivered', 'Ready', 'Collected']

/** Flatten every revenue-producing record into one comparable list (USD). */
export function buildSales(d: Data): Sale[] {
  const cust = new Map(d.customers.map((c) => [c.id!, c]))
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  const out: Sale[] = []
  for (const b of d.bookings) {
    if (b.status !== 'confirmed' && b.status !== 'completed') continue
    const p = pkg.get(b.packageId)
    if (!p) continue
    out.push({
      date: b.createdAt, service: 'Package', label: p.name, revenue: p.price * b.pax,
      margin: (p.price - p.cost) * b.pax, country: p.country, dest: b.destination,
      origin: cust.get(b.customerId)?.township, days: p.days,
    })
  }
  const caseSales = (rows: Data['visas'], service: Service, isVisa: boolean) => {
    for (const c of rows) {
      if (!DONE.includes(c.stage)) continue
      out.push({
        date: c.decidedAt ?? c.appliedAt, service, label: `${service} ${c.kind}`, revenue: c.fee, margin: c.fee - c.cost,
        country: isVisa ? (c.kind as Country) : undefined, origin: cust.get(c.customerId)?.township,
      })
    }
  }
  caseSales(d.visas, 'Visa', true)
  caseSales(d.passports, 'Passport', false)
  for (const t of d.tickets) {
    const other = t.direction === 'Outbound' ? t.to : t.from
    out.push({
      date: t.date, service: 'Air ticket', label: `${t.from}→${t.to}`, revenue: t.fare, margin: t.commission,
      country: countryOfPlace(other), dest: other, origin: cust.get(t.customerId)?.township,
    })
  }
  return out
}

export interface Agg { key: string; revenue: number; margin: number; count: number }
export function sumBy<T extends { revenue: number; margin: number }>(rows: T[], keyFn: (r: T) => string | undefined): Agg[] {
  const m = new Map<string, Agg>()
  for (const r of rows) {
    const k = keyFn(r)
    if (k == null) continue
    const a = m.get(k) ?? { key: k, revenue: 0, margin: 0, count: 0 }
    a.revenue += r.revenue; a.margin += r.margin; a.count++
    m.set(k, a)
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue)
}

export const monthKey = (iso: string) => iso.slice(0, 7)
export function lastMonths(n: number, now = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
export const totals = (rows: { revenue: number; margin: number }[]) => ({
  revenue: rows.reduce((s, r) => s + r.revenue, 0),
  margin: rows.reduce((s, r) => s + r.margin, 0),
  count: rows.length,
})
export const pctDelta = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / prev) * 100)

export interface Range { from: string; to: string }
export type Preset = '30d' | '90d' | '12m' | 'all'
export function rangeFor(preset: Preset, now = new Date()): Range & { prev: Range } {
  const day = 86400000
  const to = now.toISOString().slice(0, 10)
  if (preset === 'all') return { from: '0000-01-01', to, prev: { from: '0000-01-01', to: '0000-01-01' } }
  const n = preset === '30d' ? 30 : preset === '90d' ? 90 : 365
  const from = new Date(now.getTime() - n * day).toISOString().slice(0, 10)
  const pfrom = new Date(now.getTime() - 2 * n * day).toISOString().slice(0, 10)
  return { from, to, prev: { from: pfrom, to: from } }
}
export const inRange = (date: string, r: Range) => date >= r.from && date <= r.to
