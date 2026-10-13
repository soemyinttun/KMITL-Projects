/** Excel workbook with every table and the summaries. Money cells are numbers formatted as kyat. */
import ExcelJS from 'exceljs'
import type { Data } from '../../src/types.ts'
import * as C from './config.ts'
import { ITINERARIES } from './itineraries.ts'
import { byOrigin, byPackage, byStop, grandTotal, monthly } from './summary.ts'

const KS = '#,##0 "Ks"'
const LAKH_FMT = '#,##0.00'
const SERVICES = ['Package', 'Visa', 'Passport', 'Air ticket'] as const

interface Col { header: string; key: string; width?: number; money?: boolean; lakh?: boolean }

function addSheet(wb: ExcelJS.Workbook, name: string, cols: Col[], rows: Record<string, unknown>[], totalRow?: Record<string, unknown>) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = cols.map((c) => ({
    header: c.header, key: c.key,
    width: c.width ?? Math.min(60, Math.max(c.header.length + 2, ...rows.map((r) => String(r[c.key] ?? '').length + 2), c.money ? 16 : 8)),
    style: c.money ? { numFmt: KS } : c.lakh ? { numFmt: LAKH_FMT } : {},
  }))
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } }
  ws.addRows(rows)
  if (totalRow) ws.addRow(totalRow).font = { bold: true }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } }
  return ws
}

export async function writeWorkbook(d: Data, path: string) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SSM Travel Ops dataset generator'
  wb.created = wb.modified = new Date(Date.UTC(C.YEAR + 1, 0, 1))
  const total = grandTotal(d)
  const name = new Map(d.customers.map((c) => [c.id!, c.name]))

  const about = wb.addWorksheet('About')
  about.columns = [{ width: 34 }, { width: 90 }]
  ;[
    ['SSM Travel Ops — 2024 demo dataset', ''],
    ['WARNING', 'Synthetic demo data. All prices, costs, fees and fares are ESTIMATES, not SSM Travel & Tours real prices.'],
    ['Period', `1 Jan – 31 Dec ${C.YEAR}`],
    ['Currency', 'Myanmar kyat (Ks). 1 lakh = 100,000 Ks'],
    ['Total profit (Ks)', total.profit],
    ['Total profit (lakh)', total.profit / C.LAKH],
    ['Total revenue (Ks)', total.revenue],
    ['Peak months', 'April, May, September, October, November, December'],
    ['Profit', 'Price − cost (the app\'s Gross margin). Office costs, salaries and tax not included.'],
    ['Exchange rate', `Stored in kyat; USD display uses ${C.FX_ESTIMATE} Ks/USD (estimate).`],
    ['Visa fees', 'Fee includes the government fee; cost = government fee + processing.'],
    ['Air tickets', 'Stand-alone ticket sales; package prices already include flights. Profit = commission.'],
    ['Origins', 'Rakhine is a state, plotted at Sittwe.'],
    ['Documentation', 'docs/dataset-2024.md'],
  ].forEach((r, i) => {
    const row = about.addRow(r)
    if (i === 0) row.font = { bold: true, size: 14 }
    if (i === 1) row.font = { bold: true, color: { argb: 'FFB45309' } }
    row.getCell(1).font = { ...row.getCell(1).font, bold: true }
  })
  about.getCell('B5').numFmt = KS
  about.getCell('B6').numFmt = LAKH_FMT
  about.getCell('B7').numFmt = KS

  const months = monthly(d)
  addSheet(
    wb, 'Monthly Summary',
    [
      { header: 'Month', key: 'name' }, { header: 'Peak', key: 'peak' },
      ...SERVICES.flatMap((s) => [{ header: `${s} revenue`, key: `${s}_rev`, money: true }, { header: `${s} profit`, key: `${s}_profit`, money: true }]),
      { header: 'Total revenue', key: 'rev', money: true }, { header: 'Total profit', key: 'profit', money: true }, { header: 'Profit (lakh)', key: 'lakh', lakh: true },
    ],
    months.map((m) => ({
      name: m.name, peak: m.peak ? 'Peak' : '',
      ...Object.fromEntries(SERVICES.flatMap((s) => [[`${s}_rev`, m.byService[s].revenue], [`${s}_profit`, m.byService[s].profit]])),
      rev: m.total.revenue, profit: m.total.profit, lakh: m.total.profit / C.LAKH,
    })),
    {
      name: 'TOTAL',
      ...Object.fromEntries(SERVICES.flatMap((s) => [[`${s}_rev`, months.reduce((x, m) => x + m.byService[s].revenue, 0)], [`${s}_profit`, months.reduce((x, m) => x + m.byService[s].profit, 0)]])),
      rev: total.revenue, profit: total.profit, lakh: total.profit / C.LAKH,
    },
  )

  addSheet(
    wb, 'Packages & Itineraries',
    [
      { header: 'ID', key: 'id' }, { header: 'Package', key: 'name' }, { header: 'Country', key: 'country' }, { header: 'Days', key: 'days' },
      { header: 'Price / person', key: 'price', money: true }, { header: 'Cost / person', key: 'cost', money: true },
      { header: 'Profit / person', key: 'unit', money: true }, { header: 'Stops', key: 'stops', width: 60 }, { header: 'Note', key: 'note', width: 50 },
    ],
    d.packages.map((p) => ({ ...p, unit: p.price - p.cost, stops: p.stops.join(' → '), note: ITINERARIES.find((i) => i.packageId === p.id)?.note ?? '' })),
  )
  const it = wb.getWorksheet('Packages & Itineraries')!
  it.addRow([])
  it.addRow(['Package', 'Day', 'Plan', 'Details']).font = { bold: true }
  for (const i of ITINERARIES) for (const x of i.days) it.addRow([i.packageId, Number(x.day), x.title, x.detail ?? ''])

  addSheet(wb, 'By Package', [
    { header: 'ID', key: 'id' }, { header: 'Package', key: 'name' }, { header: 'Days', key: 'days' }, { header: 'Enquiries', key: 'enquiries' },
    { header: 'Cancelled', key: 'cancelled' }, { header: 'Bookings', key: 'bookings' }, { header: 'Travellers', key: 'pax' },
    { header: 'Revenue', key: 'revenue', money: true }, { header: 'Profit', key: 'profit', money: true },
  ], byPackage(d) as unknown as Record<string, unknown>[])
  addSheet(wb, 'By Destination', [
    { header: 'Place (itinerary stop)', key: 'place' }, { header: 'Bookings passing through', key: 'bookings' }, { header: 'Travellers', key: 'travellers' },
  ], byStop(d) as unknown as Record<string, unknown>[])
  addSheet(wb, 'By Origin', [
    { header: 'Origin', key: 'origin' }, { header: 'Customers', key: 'customers' }, { header: 'Bookings', key: 'bookings' }, { header: 'Travellers', key: 'travellers' },
    { header: 'Package revenue', key: 'revenue', money: true }, { header: 'Package profit', key: 'profit', money: true },
  ], byOrigin(d) as unknown as Record<string, unknown>[])

  addSheet(wb, 'Customers', [
    { header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Phone', key: 'phone' }, { header: 'Origin', key: 'township' }, { header: 'Passport expiry', key: 'passportExpiry' },
  ], d.customers as unknown as Record<string, unknown>[])
  const pkg = new Map(d.packages.map((p) => [p.id, p]))
  addSheet(wb, 'Bookings', [
    { header: 'ID', key: 'id' }, { header: 'Sale date', key: 'createdAt' }, { header: 'Customer', key: 'customer' }, { header: 'Package', key: 'packageId' },
    { header: 'Destination', key: 'destination' }, { header: 'Departure', key: 'departDate' }, { header: 'Pax', key: 'pax' }, { header: 'Status', key: 'status' },
    { header: 'Revenue', key: 'revenue', money: true }, { header: 'Profit', key: 'profit', money: true },
  ], d.bookings.map((b) => {
    const p = pkg.get(b.packageId)!, won = b.status === 'completed' || b.status === 'confirmed'
    return { ...b, customer: name.get(b.customerId), revenue: won ? p.price * b.pax : 0, profit: won ? (p.price - p.cost) * b.pax : 0 }
  }))
  for (const [sheet, rows] of [['Visas', d.visas], ['Passports', d.passports]] as const)
    addSheet(wb, sheet, [
      { header: 'ID', key: 'id' }, { header: 'Customer', key: 'customer' }, { header: 'Kind', key: 'kind' }, { header: 'Stage', key: 'stage' },
      { header: 'Applied', key: 'appliedAt' }, { header: 'Decided', key: 'decidedAt' }, { header: 'Fee', key: 'fee', money: true },
      { header: 'Cost', key: 'cost', money: true }, { header: 'Profit', key: 'profit', money: true },
    ], rows.map((c) => ({ ...c, customer: name.get(c.customerId), profit: ['Approved', 'Delivered', 'Ready', 'Collected'].includes(c.stage) ? c.fee - c.cost : 0 })))
  addSheet(wb, 'Tickets', [
    { header: 'ID', key: 'id' }, { header: 'Date', key: 'date' }, { header: 'Customer', key: 'customer' }, { header: 'Direction', key: 'direction' },
    { header: 'From', key: 'from' }, { header: 'To', key: 'to' }, { header: 'Airline', key: 'airline' },
    { header: 'Fare', key: 'fare', money: true }, { header: 'Commission (profit)', key: 'commission', money: true },
  ], d.tickets.map((t) => ({ ...t, customer: name.get(t.customerId) })))

  await wb.xlsx.writeFile(path)
}
