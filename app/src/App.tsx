import { Component, useEffect, useState, type ReactNode } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './state'
import { SERVICES } from './types'
import type { Preset } from './analytics'
import { Loading, inp } from './components/ui'
import Overview from './pages/Overview'
import Revenue from './pages/Revenue'
import Packages from './pages/Packages'
import Pipeline from './pages/Pipeline'
import Tickets from './pages/Tickets'
import Trips from './pages/Trips'
import Heatmaps from './pages/Heatmaps'
import Bookings from './pages/Bookings'
import Customers from './pages/Customers'
import Settings from './pages/Settings'

const NAV = [
  ['/', 'Overview', '📊'], ['/revenue', 'Revenue', '💰'], ['/packages', 'Packages', '🧳'],
  ['/visa', 'Visa', '🛂'], ['/passport', 'Passport', '📘'], ['/tickets', 'Tickets', '✈️'],
  ['/trips', 'Trips', '📅'], ['/heatmaps', 'Heatmaps', '🔥'], ['/bookings', 'Bookings', '🧾'],
  ['/customers', 'Customers', '👥'], ['/settings', 'Settings', '⚙️'],
] as const

export default function App() {
  const { filters, setFilters, data } = useApp()
  const online = useOnline()
  const loc = useLocation()
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="hidden w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r border-slate-200 bg-white p-3 md:flex">
        <div className="mb-3 px-2 text-base font-bold leading-tight text-teal-800">🏔️ SSM Travel &amp; Tours Co., Ltd.</div>
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-medium text-teal-800' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="mr-2">{icon}</span>{label}
          </NavLink>
        ))}
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <span className="font-bold text-teal-800 md:hidden">🏔️ SSM Travel</span>
          <select aria-label="Date range" className={inp} value={filters.preset} onChange={(e) => setFilters({ preset: e.target.value as Preset })}>
            <option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option><option value="all">All time</option>
          </select>
          <select aria-label="Service" className={inp} value={filters.service} onChange={(e) => setFilters({ service: e.target.value as typeof filters.service })}>
            <option value="All">All services</option>
            {SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Currency" className={inp} value={filters.currency} onChange={(e) => setFilters({ currency: e.target.value as 'USD' | 'MMK' })}>
            <option>USD</option><option>MMK</option>
          </select>
          {filters.dest && (
            <button className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800" onClick={() => setFilters({ dest: null })}>
              📍 {filters.dest} ✕
            </button>
          )}
          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white'}`}>
            {online ? 'Online' : 'Offline mode'}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 md:p-6 md:pb-6">
          {!data ? <Loading /> : <Boundary key={loc.pathname}><Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/visa" element={<Pipeline kind="visa" />} />
            <Route path="/passport" element={<Pipeline kind="passport" />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/heatmaps" element={<Heatmaps />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
          </Routes></Boundary>}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-[1000] flex overflow-x-auto border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-w-[4.5rem] flex-col items-center px-2 py-1.5 text-[11px] ${isActive ? 'text-teal-800 font-semibold' : 'text-slate-500'}`}>
              <span className="text-lg">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

class Boundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {}
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (this.state.err) return <div className="rounded-2xl bg-rose-50 p-6 text-rose-800">Something went wrong on this page: {this.state.err.message}</div>
    return this.props.children
  }
}

function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const u = () => setOn(true), d = () => setOn(false)
    window.addEventListener('online', u); window.addEventListener('offline', d)
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', d) }
  }, [])
  return on
}
