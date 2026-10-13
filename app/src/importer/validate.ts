/**
 * Checks a JSON backup before it is imported and converts it to the current data model.
 * Accepts backups from this version (string ids) and from older versions (numeric ids, which
 * are replaced by new UUIDs with every reference updated).
 */
import {
  BOOKING_STATUSES, PASSPORT_STAGES, TABLES, VISA_STAGES,
  type Booking, type Case, type Customer, type Data, type Pkg, type TableName, type Ticket,
} from '../types'

export interface CheckResult {
  /** Converted data, or null when there are errors. */
  data: Data | null
  counts: Record<TableName, number>
  errors: string[]
  warnings: string[]
}

const MAX_MESSAGES = 50
const DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COUNTRIES = ['India', 'Bhutan', 'Nepal', 'Thailand']

type Obj = Record<string, unknown>

export function checkBackup(raw: unknown): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const counts = Object.fromEntries(TABLES.map((t) => [t, 0])) as Record<TableName, number>
  const err = (m: string) => { if (errors.length < MAX_MESSAGES) errors.push(m); else if (errors.length === MAX_MESSAGES) errors.push('…more problems not shown') }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { data: null, counts, errors: ['This is not a Travel Ops backup file.'], warnings }
  }
  const src = raw as Obj
  if (!TABLES.some((t) => Array.isArray(src[t]))) {
    return { data: null, counts, errors: ['This file has none of the expected lists (customers, packages, bookings, visas, passports, tickets).'], warnings }
  }
  const rows = (t: TableName): Obj[] => {
    const v = src[t]
    if (v === undefined) { warnings.push(`No "${t}" list in the file — nothing to import for it.`); return [] }
    if (!Array.isArray(v)) { err(`"${t}" should be a list.`); return [] }
    counts[t] = v.length
    return v.filter((r, i) => (typeof r === 'object' && r !== null) || (err(`${t} #${i + 1}: not a record.`), false)) as Obj[]
  }

  // Field readers that record a problem and return a safe placeholder.
  const where = (t: string, i: number) => `${t} #${i + 1}`
  const text = (r: Obj, k: string, w: string, required = true) => {
    const v = r[k]
    if (typeof v === 'string' && (v.trim() || !required)) return v
    if (v === undefined && !required) return ''
    err(`${w}: "${k}" is missing or not text.`)
    return ''
  }
  const kyat = (r: Obj, k: string, w: string) => {
    const v = r[k]
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return v
    err(`${w}: "${k}" must be a whole number of kyat (0 or more), got ${JSON.stringify(v)}.`)
    return 0
  }
  const count = (r: Obj, k: string, w: string) => {
    const v = r[k]
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v
    err(`${w}: "${k}" must be a whole number above 0.`)
    return 1
  }
  const date = (r: Obj, k: string, w: string, required = true): string | undefined => {
    const v = r[k]
    if (v === undefined || v === null || v === '') { if (required) err(`${w}: "${k}" date is missing.`); return undefined }
    if (typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v))) return v
    err(`${w}: "${k}" must be a date like 2024-03-31, got ${JSON.stringify(v)}.`)
    return undefined
  }
  const oneOf = <T extends string>(r: Obj, k: string, w: string, allowed: readonly T[]): T => {
    const v = r[k]
    if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T
    err(`${w}: "${k}" must be one of ${allowed.join(', ')}, got ${JSON.stringify(v)}.`)
    return allowed[0]!
  }

  // Ids: numeric (older versions) or non-UUID text get a fresh UUID; references are remapped.
  const idMaps = new Map<TableName, Map<string, string>>(TABLES.map((t) => [t, new Map()]))
  const newId = (t: TableName, r: Obj, w: string): string => {
    const v = r['id']
    if (v === undefined || v === null || v === '') { err(`${w}: "id" is missing.`); return crypto.randomUUID() }
    const key = String(v)
    const map = idMaps.get(t)!
    if (map.has(key)) { err(`${w}: id ${key} is used twice.`); return crypto.randomUUID() }
    const id = t === 'packages' ? key : typeof v === 'string' && UUID.test(v) ? v : crypto.randomUUID()
    map.set(key, id)
    return id
  }
  const meta = (r: Obj) => ({
    ...(typeof r['updatedAt'] === 'string' ? { updatedAt: r['updatedAt'] } : {}),
    ...(r['deleted'] === true ? { deleted: true } : {}),
  })

  // Pass 1: records and their ids.
  const customersRaw = rows('customers'), packagesRaw = rows('packages')
  const customers: Customer[] = customersRaw.map((r, i) => {
    const w = where('customers', i)
    return { id: newId('customers', r, w), name: text(r, 'name', w), phone: text(r, 'phone', w, false), township: text(r, 'township', w, false), passportExpiry: date(r, 'passportExpiry', w, false) ?? '', ...meta(r) }
  })
  const packages: Pkg[] = packagesRaw.map((r, i) => {
    const w = where('packages', i)
    const stops = r['stops'] === undefined ? [] : Array.isArray(r['stops']) && r['stops'].every((s) => typeof s === 'string') ? (r['stops'] as string[]) : (err(`${w}: "stops" must be a list of place names.`), [])
    const price = kyat(r, 'price', w), cost = kyat(r, 'cost', w)
    if (cost > price) warnings.push(`${w} (${String(r['name'])}): cost is higher than price.`)
    return {
      id: newId('packages', r, w), name: text(r, 'name', w), country: oneOf(r, 'country', w, COUNTRIES) as Pkg['country'],
      days: count(r, 'days', w), price, cost, stops, ...meta(r),
    }
  })

  // Pass 2: records that point to customers and packages.
  const ref = (t: TableName, v: unknown, w: string, field: string): string => {
    const id = idMaps.get(t)!.get(String(v))
    if (id) return id
    err(`${w}: "${field}" ${JSON.stringify(v)} does not match any ${t === 'customers' ? 'customer' : 'package'} in the file.`)
    return ''
  }
  const bookings: Booking[] = rows('bookings').map((r, i) => {
    const w = where('bookings', i)
    return {
      id: newId('bookings', r, w), customerId: ref('customers', r['customerId'], w, 'customerId'), packageId: ref('packages', r['packageId'], w, 'packageId'),
      destination: text(r, 'destination', w, false), departDate: date(r, 'departDate', w) ?? '', pax: count(r, 'pax', w),
      status: oneOf(r, 'status', w, BOOKING_STATUSES), createdAt: date(r, 'createdAt', w) ?? '', ...meta(r),
    }
  })
  const cases = (t: 'visas' | 'passports', stages: string[]): Case[] => rows(t).map((r, i) => {
    const w = where(t, i)
    const decidedAt = date(r, 'decidedAt', w, false), deadline = date(r, 'deadline', w, false)
    return {
      id: newId(t, r, w), customerId: ref('customers', r['customerId'], w, 'customerId'), kind: text(r, 'kind', w),
      stage: oneOf(r, 'stage', w, stages), appliedAt: date(r, 'appliedAt', w) ?? '', fee: kyat(r, 'fee', w), cost: kyat(r, 'cost', w),
      ...(decidedAt ? { decidedAt } : {}), ...(deadline ? { deadline } : {}), ...meta(r),
    }
  })
  const visas = cases('visas', VISA_STAGES), passports = cases('passports', PASSPORT_STAGES)
  const tickets: Ticket[] = rows('tickets').map((r, i) => {
    const w = where('tickets', i)
    return {
      id: newId('tickets', r, w), customerId: ref('customers', r['customerId'], w, 'customerId'),
      direction: oneOf(r, 'direction', w, ['Inbound', 'Outbound'] as const), from: text(r, 'from', w), to: text(r, 'to', w),
      airline: text(r, 'airline', w, false), date: date(r, 'date', w) ?? '', fare: kyat(r, 'fare', w), commission: kyat(r, 'commission', w), ...meta(r),
    }
  })

  const data = { customers, packages, bookings, visas, passports, tickets }
  return { data: errors.length ? null : data, counts, errors, warnings }
}

/**
 * For "Add to current data": gives every record except packages a new id (so nothing collides
 * with records already on the system) and updates the references. Package codes are kept, so an
 * imported package with an existing code updates that package.
 */
export function withFreshIds(d: Data): Data {
  const customerIds = new Map(d.customers.map((c) => [c.id, crypto.randomUUID()]))
  const fresh = <T extends { id: string; customerId: string }>(rows: T[]): T[] =>
    rows.map((r) => ({ ...r, id: crypto.randomUUID(), customerId: customerIds.get(r.customerId) ?? r.customerId }))
  return {
    customers: d.customers.map((c) => ({ ...c, id: customerIds.get(c.id)! })),
    packages: d.packages,
    bookings: fresh(d.bookings),
    visas: fresh(d.visas),
    passports: fresh(d.passports),
    tickets: fresh(d.tickets),
  }
}
