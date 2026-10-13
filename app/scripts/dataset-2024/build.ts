/**
 * Deterministic builder for the 2024 demo dataset. Same inputs → identical output.
 *
 * Each month's profit target is TARGET_PROFIT × MONTH_WEIGHTS. Within a month:
 * packages fill up to PACKAGE_SHARE_CAP, visas and passports take their shares in whole
 * cases, and air-ticket commissions take the exact remainder, so every month (and the year)
 * hits its target to the kyat.
 */
import type { Booking, BookingStatus, Case, Customer, Data, Ticket } from '../../src/types.ts'
import * as C from './config.ts'

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const pad = (n: number) => String(n).padStart(2, '0')
const daysIn = (m: number) => new Date(Date.UTC(C.YEAR, m, 0)).getUTCDate()
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10)
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

/** Profit target per month (kyat), adjusted so the twelve months add up to TARGET_PROFIT exactly. */
export function monthTargets(): number[] {
  const t = C.MONTH_WEIGHTS.map((w) => Math.round((C.TARGET_PROFIT * w) / 100))
  t[11]! += C.TARGET_PROFIT - sum(t)
  return t
}

export function buildDataset(): Data {
  const r = rng(C.YEAR)
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))
  const pkgById = new Map(C.PACKAGES.map((p) => [p.id, p]))

  // ── Customers ────────────────────────────────────────────────────────────
  const customers: Customer[] = []
  const byOrigin = new Map<string, number[]>()
  const usedNames = new Set<string>()
  const makeName = () => {
    for (;;) {
      const female = r() < 0.55
      const sy = female ? C.FEMALE_SYLLABLES : C.MALE_SYLLABLES
      const prefix = (female ? C.FEMALE_PREFIX : C.MALE_PREFIX)[int(0, 1)]!
      const parts = Array.from({ length: int(2, 3) }, () => sy[int(0, sy.length - 1)]!)
      const name = `${prefix} ${parts.join(' ')}`
      if (new Set(parts).size === parts.length && !usedNames.has(name)) { usedNames.add(name); return name }
    }
  }
  for (const [origin, count] of C.ORIGIN_CUSTOMERS) {
    for (let i = 0; i < count; i++) {
      const id = customers.length + 1
      customers.push({
        id, name: makeName(), phone: `09${int(400_000_000, 999_999_999)}`, township: origin,
        // Valid for at least 6 months after every 2024 trip (latest returns are in early 2025).
        passportExpiry: addDays('2025-10-01', int(0, 2900)),
      })
      byOrigin.set(origin, [...(byOrigin.get(origin) ?? []), id])
    }
  }
  const cursor = new Map<string, number>()
  const nextCustomerFrom = (origin: string) => {
    const ids = byOrigin.get(origin)!
    const i = cursor.get(origin) ?? 0
    cursor.set(origin, i + 1)
    return ids[i % ids.length]!
  }
  // Completed trips and enquiries each walk ORIGIN_CYCLE from the start, so the origin heatmap keeps the
  // intended ranking in both its "Bookings" and "Enquiries" views. Everything else shares a third walk.
  const slots = { completed: 0, enquiry: 0, other: 0 }
  const nextCustomer = (walk: keyof typeof slots = 'other') => nextCustomerFrom(C.ORIGIN_CYCLE[slots[walk]++ % C.ORIGIN_CYCLE.length]!)

  // ── Month-by-month records ───────────────────────────────────────────────
  const bookings: Booking[] = []
  const visas: Case[] = []
  const passports: Case[] = []
  const tickets: Ticket[] = []
  let bagIndex = 0, visaIndex = 0, passportIndex = 0, routeIndex = 0
  const targets = monthTargets()

  for (let m = 1; m <= 12; m++) {
    const target = targets[m - 1]!
    const day = (lo: number, hi: number) => `${C.YEAR}-${pad(m)}-${pad(int(lo, Math.min(hi, daysIn(m))))}`
    const monthCustomers: number[] = []

    const addBooking = (packageId: string, pax: number, status: BookingStatus) => {
      const createdAt = day(1, 31)
      const customerId = nextCustomer(status === 'completed' || status === 'enquiry' ? status : 'other')
      if (status === 'completed') monthCustomers.push(customerId)
      bookings.push({
        id: bookings.length + 1, customerId, packageId, destination: C.MAIN_DESTINATION[packageId]!,
        departDate: addDays(createdAt, int(14, 42)), pax, status, createdAt,
      })
      const p = pkgById.get(packageId)!
      return status === 'completed' ? (p.price - p.cost) * pax : 0
    }

    // Packages: Thailand trips first, then India packages in bag order until the next one no longer fits.
    let packageProfit = 0
    for (const [tm, pax] of C.THAILAND_TRIPS) if (tm === m) packageProfit += addBooking('TH5', pax, 'completed')
    const cap = Math.floor(target * C.PACKAGE_SHARE_CAP)
    for (;;) {
      const id = C.INDIA_PACKAGE_BAG[bagIndex % C.INDIA_PACKAGE_BAG.length]!
      const p = pkgById.get(id)!
      const pax = Math.min(int(1, 6), Math.floor((cap - packageProfit) / (p.price - p.cost)))
      if (pax < 1) break // carry this package over to next month so the mix stays as designed
      bagIndex++
      packageProfit += addBooking(id, pax, 'completed')
    }
    // Enquiries that did not convert and cancellations earn nothing but show demand.
    const peak = C.PEAK_MONTHS.includes(m)
    for (let i = 0; i < (peak ? 2 : 1); i++) addBooking(C.INDIA_PACKAGE_BAG[int(0, 10)]!, int(1, 4), 'enquiry')
    if ([5, 10, 12].includes(m)) addBooking(C.INDIA_PACKAGE_BAG[int(0, 10)]!, int(2, 4), 'cancelled')

    const caseFor = (kind: string, fee: number, cost: number, stage: string, customerId: number): Case => {
      const appliedAt = day(1, 16)
      return { id: 0, customerId, kind, stage, appliedAt, decidedAt: addDays(appliedAt, int(3, 10)), fee, cost }
    }

    // Visas (~3%): whole cases while they fit, for this month's travellers first.
    let visaProfit = 0
    for (;;) {
      const [kind, fee, cost] = C.VISA_TYPES[visaIndex % C.VISA_TYPES.length]!
      if (visaProfit + (fee - cost) / 2 > target * C.VISA_SHARE) break // nearest whole case
      visaIndex++
      const customerId = monthCustomers.length ? monthCustomers[visas.length % monthCustomers.length]! : nextCustomer()
      visas.push({ ...caseFor(kind, fee, cost, 'Delivered', customerId), id: visas.length + 1 })
      visaProfit += fee - cost
    }
    if (m === 5 || m === 11) {
      const [kind, fee, cost] = C.VISA_TYPES[0]!
      visas.push({ ...caseFor(kind, fee, cost, 'Rejected', nextCustomer()), id: visas.length + 1 })
    }

    // Passports (~6%).
    let passportProfit = 0
    for (;;) {
      const [kind, fee, cost] = C.PASSPORT_TYPES[passportIndex % C.PASSPORT_TYPES.length]!
      if (passportProfit + (fee - cost) / 2 > target * C.PASSPORT_SHARE) break
      passportIndex++
      passports.push({ ...caseFor(kind, fee, cost, 'Collected', nextCustomer()), id: passports.length + 1 })
      passportProfit += fee - cost
    }

    // Air tickets take the exact remainder as commission (~15%).
    const remainder = target - packageProfit - visaProfit - passportProfit
    const n = Math.max(1, Math.round(remainder / 45_000))
    const base = Math.floor(remainder / n)
    let given = 0
    for (let i = 0; i < n; i++) {
      const commission = i < n - 1 ? base + Math.round(int(-8000, 8000) / 500) * 500 : remainder - given
      given += commission
      const route = C.TICKET_ROUTES[routeIndex++ % C.TICKET_ROUTES.length]!
      tickets.push({
        id: tickets.length + 1, customerId: nextCustomer(), direction: route.direction, from: route.from, to: route.to,
        airline: route.airline, date: day(1, 31), fare: Math.round((route.fare * (0.9 + r() * 0.2)) / 10_000) * 10_000, commission,
      })
    }
    if (remainder <= 0 || tickets[tickets.length - 1]!.commission <= 0) throw new Error(`Month ${m}: no room left for ticket commission`)
  }

  const data: Data = { customers, packages: C.PACKAGES, bookings, visas, passports, tickets }
  const profit = totalProfit(data)
  if (profit !== C.TARGET_PROFIT) throw new Error(`Total profit ${profit} ≠ target ${C.TARGET_PROFIT}`)
  return data
}

/** Profit as the app counts it (see src/analytics.ts buildSales). */
export function totalProfit(d: Data): number {
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  const done = ['Approved', 'Delivered', 'Ready', 'Collected']
  return (
    sum(d.bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').map((b) => (pkg.get(b.packageId)!.price - pkg.get(b.packageId)!.cost) * b.pax)) +
    sum([...d.visas, ...d.passports].filter((c) => done.includes(c.stage)).map((c) => c.fee - c.cost)) +
    sum(d.tickets.map((t) => t.commission))
  )
}
