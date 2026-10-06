import { useState } from 'react'
import { db } from '../db'
import { useApp } from '../state'
import { inRange, rangeFor } from '../analytics'
import { Card, Chart, Loading, Page, Seg, inp } from '../components/ui'

type Metric = 'Revenue' | 'Margin' | 'Bookings' | 'Conversion'

export default function Packages() {
  const { data, money, filters } = useApp()
  const [metric, setMetric] = useState<Metric>('Revenue')
  const [sort, setSort] = useState<string>('revenue')
  if (!data) return <Loading />
  const r = rangeFor(filters.preset)

  const rows = data.packages.map((p) => {
    const bs = data.bookings.filter((b) => b.packageId === p.id && inRange(b.createdAt, r))
    const won = bs.filter((b) => b.status === 'confirmed' || b.status === 'completed')
    const pax = won.reduce((s, b) => s + b.pax, 0)
    return {
      p, enquiries: bs.length, bookings: won.length, pax,
      revenue: pax * p.price, margin: pax * (p.price - p.cost), marginPct: ((p.price - p.cost) / p.price) * 100,
      avgGroup: won.length ? pax / won.length : 0, conv: bs.length ? (won.length / bs.length) * 100 : 0,
    }
  })
  const sorted = [...rows].sort((a, b) => {
    const get = (x: (typeof rows)[number]) => (sort === 'name' ? x.p.name : sort === 'days' ? x.p.days : (x as never)[sort] as number)
    return get(b) > get(a) ? 1 : -1
  })
  const val = (x: (typeof rows)[number]) => (metric === 'Revenue' ? x.revenue : metric === 'Margin' ? x.margin : metric === 'Bookings' ? x.bookings : x.conv)
  const days = [4, 7, 8, 12, 15]
  const fmtAxis = (v: number) => (metric === 'Revenue' || metric === 'Margin' ? money(v, true) : metric === 'Conversion' ? `${v.toFixed(0)}%` : String(v))

  const th = (k: string, label: string) => (
    <th className="cursor-pointer whitespace-nowrap px-2 py-2 text-left hover:text-teal-700" onClick={() => setSort(k)}>{label}{sort === k ? ' ▾' : ''}</th>
  )
  const upd = (id: string, patch: { price?: number; cost?: number }) => db.packages.update(id, patch)

  return (
    <Page title="Package comparison" sub="India vs Bhutan across 4, 7, 8, 12 and 15-day itineraries. Edit prices inline (USD).">
      <Card title={`${metric} by duration`} right={<Seg options={['Revenue', 'Margin', 'Bookings', 'Conversion'] as const} value={metric} onChange={setMetric} />}>
        <Chart
          height={300}
          option={{
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { top: 0 },
            xAxis: { type: 'category', data: days.map((d) => `${d} days`) },
            yAxis: { type: 'value', axisLabel: { formatter: fmtAxis } },
            series: (['India', 'Bhutan'] as const).map((c) => ({
              name: c, type: 'bar', itemStyle: { borderRadius: [6, 6, 0, 0] },
              data: days.map((d) => { const x = rows.find((y) => y.p.country === c && y.p.days === d); return x ? val(x) : 0 }),
            })),
          }}
        />
      </Card>

      <Card title="Package table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>{th('name', 'Package')}{th('price', 'Price')}{th('cost', 'Cost')}{th('marginPct', 'Margin %')}{th('enquiries', 'Enquiries')}{th('bookings', 'Booked')}{th('conv', 'Conv %')}{th('avgGroup', 'Avg pax')}{th('revenue', 'Revenue')}{th('margin', 'Margin')}</tr>
            </thead>
            <tbody>
              {sorted.map((x) => (
                <tr key={x.p.id} className="border-b last:border-0">
                  <td className="px-2 py-1.5 font-medium">{x.p.name}</td>
                  <td className="px-2"><input type="number" className={`${inp} w-24`} defaultValue={x.p.price} onBlur={(e) => upd(x.p.id, { price: +e.target.value })} /></td>
                  <td className="px-2"><input type="number" className={`${inp} w-24`} defaultValue={x.p.cost} onBlur={(e) => upd(x.p.id, { cost: +e.target.value })} /></td>
                  <td className="px-2">{x.marginPct.toFixed(1)}%</td>
                  <td className="px-2">{x.enquiries}</td><td className="px-2">{x.bookings}</td>
                  <td className="px-2">{x.conv.toFixed(0)}%</td><td className="px-2">{x.avgGroup.toFixed(1)}</td>
                  <td className="px-2">{money(x.revenue)}</td><td className="px-2">{money(x.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Bhutan prices should include the government Sustainable Development Fee; set your current rate in the price/cost columns.</p>
      </Card>
    </Page>
  )
}
