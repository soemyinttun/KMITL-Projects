/**
 * App field ↔ cloud column names (see supabase/migrations/0001_init.sql). `empty` says how a
 * missing value is stored in the app: '' for required text fields, or the field is left out.
 */
import type { TableName } from '../types'

interface Col { app: string; db: string; empty?: '' | 'omit' }
const SYNC: Col[] = [{ app: 'id', db: 'id' }, { app: 'updatedAt', db: 'updated_at' }, { app: 'deleted', db: 'deleted' }]

export const COLUMNS: Record<TableName, Col[]> = {
  customers: [
    { app: 'name', db: 'name' }, { app: 'phone', db: 'phone' }, { app: 'township', db: 'township' },
    { app: 'passportExpiry', db: 'passport_expiry', empty: '' },
  ],
  packages: [
    { app: 'name', db: 'name' }, { app: 'country', db: 'country' }, { app: 'days', db: 'days' },
    { app: 'price', db: 'price' }, { app: 'cost', db: 'cost' }, { app: 'stops', db: 'stops' },
  ],
  bookings: [
    { app: 'customerId', db: 'customer_id' }, { app: 'packageId', db: 'package_id' }, { app: 'destination', db: 'destination' },
    { app: 'departDate', db: 'depart_date' }, { app: 'pax', db: 'pax' }, { app: 'status', db: 'status' }, { app: 'createdAt', db: 'created_on' },
  ],
  visas: caseColumns(),
  passports: caseColumns(),
  tickets: [
    { app: 'customerId', db: 'customer_id' }, { app: 'direction', db: 'direction' }, { app: 'from', db: 'from_place' },
    { app: 'to', db: 'to_place' }, { app: 'airline', db: 'airline' }, { app: 'date', db: 'ticket_date' },
    { app: 'fare', db: 'fare' }, { app: 'commission', db: 'commission' },
  ],
}
function caseColumns(): Col[] {
  return [
    { app: 'customerId', db: 'customer_id' }, { app: 'kind', db: 'kind' }, { app: 'stage', db: 'stage' },
    { app: 'appliedAt', db: 'applied_on' }, { app: 'decidedAt', db: 'decided_on', empty: 'omit' },
    { app: 'fee', db: 'fee' }, { app: 'cost', db: 'cost' }, { app: 'deadline', db: 'deadline', empty: 'omit' },
  ]
}

/** App record → cloud row. updated_at is never sent: the database sets it. */
export function toDb(t: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { id: row['id'], deleted: row['deleted'] === true }
  for (const c of COLUMNS[t]) {
    const v = row[c.app]
    out[c.db] = v === undefined || (c.empty === '' && v === '') ? null : v
  }
  return out
}

/** Cloud row → app record. */
export function fromDb(t: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const c of [...SYNC, ...COLUMNS[t]]) {
    const v = row[c.db]
    if (v === null || v === undefined) {
      if (c.empty === '') out[c.app] = ''
      continue
    }
    out[c.app] = v
  }
  if (out['deleted'] !== true) delete out['deleted']
  return out
}
