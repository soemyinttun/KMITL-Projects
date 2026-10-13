import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { seedIfEmpty } from './seed'
import { buildSales, inRange, rangeFor, type Preset, type Sale } from './analytics'
import type { Data, Service } from './types'

export interface Filters {
  preset: Preset
  service: Service | 'All'
  dest: string | null
  currency: 'USD' | 'MMK'
  fx: number // MMK per USD, used only to display USD
}
// fx default is an estimate; set the current rate in Settings.
export const DEFAULT_FX = 4500
const DEFAULTS: Filters = { preset: 'y2024', service: 'All', dest: null, currency: 'MMK', fx: DEFAULT_FX }
const FILTERS_KEY = 'travelops.filters'

function load(): Filters {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(FILTERS_KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

interface Ctx {
  data: Data | undefined
  filters: Filters
  setFilters: (p: Partial<Filters>) => void
  /** all sales after service/dest filters, any date */
  scoped: Sale[]
  /** sales in the selected date range */
  sales: Sale[]
  /** sales in the equivalent previous period */
  prevSales: Sale[]
  money: (mmk: number, compact?: boolean) => string
}
const C = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(C)

export function AppProvider({ children }: { children: ReactNode }) {
  const [filters, setF] = useState<Filters>(load)
  const [ready, setReady] = useState(false)
  useEffect(() => { seedIfEmpty().finally(() => setReady(true)) }, [])
  useEffect(() => {
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(filters)) } catch { /* private mode */ }
  }, [filters])

  const data = useLiveQuery(
    async (): Promise<Data> => ({
      customers: await db.customers.toArray(),
      packages: await db.packages.toArray(),
      bookings: await db.bookings.toArray(),
      visas: await db.visas.toArray(),
      passports: await db.passports.toArray(),
      tickets: await db.tickets.toArray(),
    }),
    [],
  )

  const value = useMemo<Ctx>(() => {
    const all = data ? buildSales(data) : []
    const scoped = all.filter((s) => (filters.service === 'All' || s.service === filters.service) && (!filters.dest || s.dest === filters.dest))
    const r = rangeFor(filters.preset)
    const fmt = (mmk: number, compact?: boolean) => {
      const v = filters.currency === 'MMK' ? mmk : mmk / filters.fx
      const nf = new Intl.NumberFormat('en', { maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' })
      return filters.currency === 'USD' ? `$${nf.format(v)}` : `${nf.format(v)} Ks`
    }
    return {
      data: ready ? data : undefined,
      filters,
      setFilters: (p) => setF((f) => ({ ...f, ...p })),
      scoped,
      sales: scoped.filter((s) => inRange(s.date, r)),
      prevSales: scoped.filter((s) => inRange(s.date, r.prev)),
      money: fmt,
    }
  }, [data, filters, ready])

  return <C.Provider value={value}>{children}</C.Provider>
}
