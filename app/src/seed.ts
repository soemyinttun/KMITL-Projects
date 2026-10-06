import { db } from './db'
import { DESTINATIONS, ORIGINS, type Booking, type BookingStatus, type Case, type Customer, type Pkg, type Ticket } from './types'

// Deterministic PRNG so demo data is stable across reloads/devices.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
}
const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

export function buildPackages(): Pkg[] {
  const india: Record<number, number> = { 4: 480, 7: 790, 8: 880, 12: 1350, 15: 1700 }
  const bhutan: Record<number, number> = { 4: 1150, 7: 1900, 8: 2150, 12: 3100, 15: 3800 }
  const out: Pkg[] = []
  for (const d of [4, 7, 8, 12, 15])
    out.push({ id: `IN${d}`, name: `India ${d}-Day`, country: 'India', days: d, price: india[d], cost: Math.round(india[d] * 0.72) })
  for (const d of [4, 7, 8, 12, 15])
    out.push({ id: `BT${d}`, name: `Bhutan ${d}-Day`, country: 'Bhutan', days: d, price: bhutan[d], cost: Math.round(bhutan[d] * 0.78) })
  return out
}

const NAMES = ['Aung Min', 'Su Su', 'Kyaw Zin', 'Hnin Wai', 'Thura', 'May Thu', 'Zaw Lin', 'Nandar', 'Htet Aung', 'Moe Moe', 'Win Naing', 'Khin Khin', 'Ye Yint', 'Phyu Phyu', 'Myo Min', 'Thiri', 'Ko Ko', 'Yin Yin', 'Naing Lin', 'Ei Mon']
const AIRLINES = ['Myanmar Airways Intl', 'Air India', 'Drukair', 'Bhutan Airlines', 'Thai Airways', 'IndiGo']

export async function seedIfEmpty() {
  if ((await db.packages.count()) > 0) return
  const r = rng(42)
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)]
  const today = new Date()
  const packages = buildPackages()
  await db.packages.bulkAdd(packages)

  const customers: Customer[] = []
  for (let i = 0; i < 60; i++) {
    const origin = r() < 0.5 ? ORIGINS[0] : r() < 0.5 ? ORIGINS[1] : pick(ORIGINS)
    customers.push({
      name: `${pick(NAMES)} ${String.fromCharCode(65 + (i % 26))}.`,
      phone: `09${Math.floor(100000000 + r() * 899999999)}`,
      township: origin.name,
      passportExpiry: iso(addDays(today, Math.floor(r() * 3000) - 120)),
    })
  }
  const ids = (await db.customers.bulkAdd(customers, { allKeys: true })) as number[]

  const bookings: Booking[] = []
  const indiaDest = DESTINATIONS.filter((d) => d.country === 'India')
  const bhutanDest = DESTINATIONS.filter((d) => d.country === 'Bhutan')
  const weightedIndia = [...indiaDest, ...indiaDest.slice(0, 3), indiaDest[0], indiaDest[1]] // Delhi/Agra/Jaipur hotter
  const dayOpts = [4, 7, 7, 8, 8, 12, 15]
  for (let i = 0; i < 260; i++) {
    const created = addDays(today, -Math.floor(r() * 365))
    const bhutan = r() < 0.38
    const days = pick(dayOpts)
    const pkg = packages.find((p) => p.country === (bhutan ? 'Bhutan' : 'India') && p.days === days)!
    const depart = addDays(created, 20 + Math.floor(r() * 60))
    const status: BookingStatus =
      r() < 0.12 ? 'cancelled' : r() < 0.2 ? 'enquiry' : depart < today ? 'completed' : 'confirmed'
    bookings.push({
      customerId: pick(ids), packageId: pkg.id,
      destination: (bhutan ? pick(bhutanDest) : pick(weightedIndia)).name,
      departDate: iso(depart), pax: 1 + Math.floor(r() * r() * 6), status, createdAt: iso(created),
    })
  }
  await db.bookings.bulkAdd(bookings)

  const mkCase = (kinds: string[], stages: string[], n: number, fee: [number, number], doneStages: string[]): Case[] =>
    Array.from({ length: n }, () => {
      const applied = addDays(today, -Math.floor(r() * 300))
      const stage = r() < 0.7 ? pick(doneStages) : pick(stages)
      const done = doneStages.includes(stage)
      return {
        customerId: pick(ids), kind: pick(kinds), stage, appliedAt: iso(applied),
        decidedAt: done ? iso(addDays(applied, 3 + Math.floor(r() * 14))) : undefined,
        fee: Math.round(fee[0] + r() * (fee[1] - fee[0])), cost: Math.round(fee[0] * 0.55),
        deadline: done ? undefined : iso(addDays(today, Math.floor(r() * 30) - 3)),
      }
    })
  await db.visas.bulkAdd(mkCase(['India', 'India', 'India', 'Bhutan'], ['Enquiry', 'Documents', 'Submitted', 'Approved', 'Rejected', 'Delivered'], 150, [60, 130], ['Approved', 'Delivered', 'Rejected']))
  await db.passports.bulkAdd(mkCase(['New', 'Renewal', 'Renewal', 'Lost', 'Damaged'], ['Enquiry', 'Documents', 'Submitted', 'Ready', 'Collected'], 90, [40, 110], ['Ready', 'Collected']))

  const routes: [string, string, 'Inbound' | 'Outbound'][] = [
    ['Yangon', 'Delhi', 'Outbound'], ['Yangon', 'Kolkata', 'Outbound'], ['Mandalay', 'Kolkata', 'Outbound'],
    ['Yangon', 'Paro', 'Outbound'], ['Mandalay', 'Delhi', 'Outbound'], ['Yangon', 'Mumbai', 'Outbound'],
    ['Delhi', 'Yangon', 'Inbound'], ['Kolkata', 'Yangon', 'Inbound'], ['Paro', 'Yangon', 'Inbound'], ['Kolkata', 'Mandalay', 'Inbound'],
  ]
  const tickets: Ticket[] = Array.from({ length: 200 }, () => {
    const [from, to, direction] = pick(routes)
    const fare = Math.round(280 + r() * 420)
    return {
      customerId: pick(ids), direction, from, to, airline: pick(AIRLINES),
      date: iso(addDays(today, Math.floor(r() * 400) - 330)), fare, commission: Math.round(fare * (0.05 + r() * 0.07)),
    }
  })
  await db.tickets.bulkAdd(tickets)
}
