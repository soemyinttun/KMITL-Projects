import { useApp } from '../state'
import { inp } from './ui'

export function CustomerSelect({ value, onChange }: { value: number | ''; onChange: (id: number) => void }) {
  const { data } = useApp()
  return (
    <select className={inp} value={value} onChange={(e) => onChange(+e.target.value)} required>
      <option value="">Customer…</option>
      {data?.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.township}</option>)}
    </select>
  )
}
