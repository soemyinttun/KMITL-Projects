/**
 * Aggregates for the documentation, CSV and workbook. Profit rules match src/analytics.ts
 * buildSales (src/dataset.test.ts checks that the two agree).
 */
import type { Data, Service } from '../../src/types.ts'
import { PEAK_MONTHS } from './config.ts'

const DONE = ['Approved', 'Delivered', 'Ready', 'Collected']
const SERVICES: Service[] = ['Package', 'Visa', 'Passport', 'Air ticket']
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Line { month: number; service: Service; revenue: number; profit: number }
export interface Money { revenue: number; profit: number }
export interface MonthRow { month: number; name: string; peak: boolean; byService: Record<Service, Money>; total: Money }

function lines(d: Data): Line[] {
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  const month = (iso: string) => Number(iso.slice(5, 7))
  const out: Line[] = []
  for (const b of d.bookings) {
    if (b.status !== 'confirmed' && b.status !== 'completed') continue
    const p = pkg.get(b.packageId)!
    out.push({ month: month(b.createdAt), service: 'Package', revenue: p.price * b.pax, profit: (p.price - p.cost) * b.pax })
  }
  for (const [rows, service] of [[d.visas, 'Visa'], [d.passports, 'Passport']] as const)
    for (const c of rows) if (DONE.includes(c.stage)) out.push({ month: month(c.decidedAt ?? c.appliedAt), service, revenue: c.fee, profit: c.fee - c.cost })
  for (const t of d.tickets) out.push({ month: month(t.date), service: 'Air ticket', revenue: t.fare, profit: t.commission })
  return out
}

const zero = (): Money => ({ revenue: 0, profit: 0 })
const add = (a: Money, l: Money) => { a.revenue += l.revenue; a.profit += l.profit }

export function monthly(d: Data): MonthRow[] {
  const rows = MONTH_NAMES.map((name, i): MonthRow => ({
    month: i + 1, name, peak: PEAK_MONTHS.includes(i + 1),
    byService: Object.fromEntries(SERVICES.map((s) => [s, zero()])) as Record<Service, Money>, total: zero(),
  }))
  for (const l of lines(d)) { const r = rows[l.month - 1]!; add(r.byService[l.service], l); add(r.total, l) }
  return rows
}

export function byService(d: Data): Record<Service, Money> {
  const out = Object.fromEntries(SERVICES.map((s) => [s, zero()])) as Record<Service, Money>
  for (const l of lines(d)) add(out[l.service], l)
  return out
}

export function grandTotal(d: Data): Money {
  const t = zero()
  for (const l of lines(d)) add(t, l)
  return t
}

export interface PackageRow { id: string; name: string; days: number; enquiries: number; cancelled: number; bookings: number; pax: number; revenue: number; profit: number }
export function byPackage(d: Data): PackageRow[] {
  return d.packages.map((p) => {
    const bs = d.bookings.filter((b) => b.packageId === p.id)
    const won = bs.filter((b) => b.status === 'confirmed' || b.status === 'completed')
    const pax = won.reduce((s, b) => s + b.pax, 0)
    return {
      id: p.id, name: p.name, days: p.days, enquiries: bs.filter((b) => b.status === 'enquiry').length,
      cancelled: bs.filter((b) => b.status === 'cancelled').length, bookings: won.length, pax,
      revenue: pax * p.price, profit: pax * (p.price - p.cost),
    }
  })
}

/** Travellers passing through each itinerary stop (the Heatmaps "Destinations" view counts the same stops). */
export interface StopRow { place: string; bookings: number; travellers: number }
export function byStop(d: Data): StopRow[] {
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  const m = new Map<string, StopRow>()
  for (const b of d.bookings) {
    if (b.status !== 'confirmed' && b.status !== 'completed') continue
    for (const place of pkg.get(b.packageId)!.stops) {
      const r = m.get(place) ?? { place, bookings: 0, travellers: 0 }
      r.bookings++; r.travellers += b.pax
      m.set(place, r)
    }
  }
  return [...m.values()].sort((a, b) => b.travellers - a.travellers || a.place.localeCompare(b.place))
}

export interface OriginRow { origin: string; customers: number; bookings: number; travellers: number; revenue: number; profit: number }
export function byOrigin(d: Data): OriginRow[] {
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  const town = new Map(d.customers.map((c) => [c.id!, c.township]))
  const m = new Map<string, OriginRow>()
  const row = (o: string) => m.get(o) ?? m.set(o, { origin: o, customers: 0, bookings: 0, travellers: 0, revenue: 0, profit: 0 }).get(o)!
  for (const c of d.customers) row(c.township).customers++
  for (const b of d.bookings) {
    if (b.status !== 'confirmed' && b.status !== 'completed') continue
    const p = pkg.get(b.packageId)!, r = row(town.get(b.customerId)!)
    r.bookings++; r.travellers += b.pax; r.revenue += p.price * b.pax; r.profit += (p.price - p.cost) * b.pax
  }
  return [...m.values()].sort((a, b) => b.customers - a.customers)
}
