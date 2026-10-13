/**
 * Generates the 2024 demo dataset and its documentation.
 * Run from app/: `npm run generate:dataset` (plain Node ≥ 23.6; types are stripped).
 *
 * Writes:
 *   app/src/data/dataset-2024.json              — loaded by the app (Settings backup format)
 *   docs/dataset-2024.md                        — documentation with summary tables
 *   docs/dataset-2024/*.csv                     — one CSV per table + monthly_summary.csv
 *   docs/dataset-2024/SSM-Travel-Ops-2024.xlsx  — Excel workbook
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildDataset } from './dataset-2024/build.ts'
import { datasetMarkdown } from './dataset-2024/docs.ts'
import { monthly } from './dataset-2024/summary.ts'
import { writeWorkbook } from './dataset-2024/workbook.ts'

const out = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))
const DATA_DIR = out('../src/data/')
const DOCS_DIR = out('../../docs/')
const CSV_DIR = out('../../docs/dataset-2024/')

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join(' → ') : v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function csv(rows: object[], columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))]
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell((r as Record<string, unknown>)[c])).join(','))].join('\n') + '\n'
}

const data = buildDataset()
mkdirSync(DATA_DIR, { recursive: true })
mkdirSync(CSV_DIR, { recursive: true })

writeFileSync(`${DATA_DIR}dataset-2024.json`, JSON.stringify(data, null, 1) + '\n')

const tables = {
  customers: [data.customers, ['id', 'name', 'phone', 'township', 'passportExpiry']],
  packages: [data.packages, ['id', 'name', 'country', 'days', 'price', 'cost', 'stops']],
  bookings: [data.bookings, ['id', 'customerId', 'packageId', 'destination', 'departDate', 'pax', 'status', 'createdAt']],
  visas: [data.visas, ['id', 'customerId', 'kind', 'stage', 'appliedAt', 'decidedAt', 'fee', 'cost']],
  passports: [data.passports, ['id', 'customerId', 'kind', 'stage', 'appliedAt', 'decidedAt', 'fee', 'cost']],
  tickets: [data.tickets, ['id', 'customerId', 'direction', 'from', 'to', 'airline', 'date', 'fare', 'commission']],
} as const
for (const [name, [rows, cols]] of Object.entries(tables)) writeFileSync(`${CSV_DIR}${name}.csv`, csv(rows as object[], [...cols]))

const services = ['Package', 'Visa', 'Passport', 'Air ticket'] as const
const key = (s: string) => s.toLowerCase().replace(' ', '_')
const months = monthly(data)
const summaryRows = months.map((m) => ({
  month: m.name, peak: m.peak ? 'yes' : 'no',
  ...Object.fromEntries(services.flatMap((s) => [[`${key(s)}_revenue`, m.byService[s].revenue], [`${key(s)}_profit`, m.byService[s].profit]])),
  total_revenue: m.total.revenue, total_profit: m.total.profit,
}))
const totalRow = Object.fromEntries(Object.keys(summaryRows[0]!).map((k) => [k, k === 'month' ? 'TOTAL' : k === 'peak' ? '' : summaryRows.reduce((s, r) => s + Number((r as Record<string, unknown>)[k]), 0)]))
writeFileSync(`${CSV_DIR}monthly_summary.csv`, csv([...summaryRows, totalRow]))

writeFileSync(`${DOCS_DIR}dataset-2024.md`, datasetMarkdown(data))
await writeWorkbook(data, `${CSV_DIR}SSM-Travel-Ops-2024.xlsx`)

console.log(`2024 dataset: ${data.customers.length} customers, ${data.bookings.length} bookings, ${data.visas.length} visas, ${data.passports.length} passports, ${data.tickets.length} tickets`)
console.log(`Total profit: ${months.reduce((s, m) => s + m.total.profit, 0).toLocaleString('en-US')} Ks`)
