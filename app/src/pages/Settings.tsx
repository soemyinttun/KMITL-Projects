import { useEffect, useRef, useState } from 'react'
import { db, resetAll } from '../db'
import { seedIfEmpty } from '../seed'
import { useApp } from '../state'
import { download } from '../ics'
import { Card, Page, btn, btnGhost, inp } from '../components/ui'

interface InstallEvent extends Event { prompt: () => Promise<void> }

export default function Settings() {
  const { filters, setFilters, data, scoped } = useApp()
  const file = useRef<HTMLInputElement>(null)
  const [install, setInstall] = useState<InstallEvent | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const exportJson = () => download(`travelops-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
  const exportCsv = () => {
    const head = 'date,service,label,country,destination,origin,revenue_usd,margin_usd'
    const body = scoped.map((s) => [s.date, s.service, s.label, s.country ?? '', s.dest ?? '', s.origin ?? '', s.revenue, s.margin].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    download('sales.csv', [head, ...body].join('\n'), 'text/csv')
  }
  const importJson = async (f: File) => {
    try {
      const d = JSON.parse(await f.text())
      if (!d.packages || !d.customers) throw new Error('Not a TravelOps backup')
      await resetAll()
      await db.transaction('rw', db.tables, async () => {
        for (const t of ['customers', 'packages', 'bookings', 'visas', 'passports', 'tickets'] as const) await (db[t] as unknown as { bulkAdd: (r: unknown[]) => Promise<unknown> }).bulkAdd(d[t] ?? [])
      })
      setMsg('Backup restored.')
    } catch (e) { setMsg(`Import failed: ${(e as Error).message}`) }
  }

  return (
    <Page title="Settings" sub="Data lives on this device (IndexedDB). Back up regularly.">
      <Card title="Currency">
        <label className="flex items-center gap-2 text-sm">1 USD =<input className={`${inp} w-28`} type="number" min={1} value={filters.fx} onChange={(e) => setFilters({ fx: +e.target.value || 1 })} /> MMK <span className="text-slate-400">(all data is stored in USD)</span></label>
      </Card>
      <Card title="Install & offline">
        <p className="mb-2 text-sm text-slate-600">Install to your home screen for a full-screen, offline-ready app. On iPhone use Share → Add to Home Screen.</p>
        <button className={btn} disabled={!install} onClick={() => install?.prompt()}>{install ? 'Install app' : 'Install prompt not available'}</button>
      </Card>
      <Card title="Backup & export">
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={exportJson}>⬇ Backup (JSON)</button>
          <button className={btnGhost} onClick={exportCsv}>⬇ Sales (CSV)</button>
          <button className={btnGhost} onClick={() => file.current?.click()}>⬆ Restore backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </Card>
      <Card title="Danger zone">
        <div className="flex flex-wrap gap-2">
          <button className={btnGhost} onClick={async () => { if (confirm('Replace all data with fresh demo data?')) { await resetAll(); await seedIfEmpty() } }}>Reset to demo data</button>
          <button className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50" onClick={async () => { if (confirm('Delete ALL data? Package catalog is removed too.')) await resetAll() }}>Erase everything</button>
        </div>
      </Card>
    </Page>
  )
}
