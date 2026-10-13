import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearDevice, table } from './db'
import * as store from './store'
import type { Data } from './types'

const pkg = { name: 'India 8-Day', country: 'India' as const, days: 8, price: 2_800_000, cost: 2_632_000, stops: [] }

beforeEach(clearDevice)

describe('store', () => {
  it('create marks the record as an unsynced change', async () => {
    const id = await store.create('customers', { name: 'Ko Aung', phone: '', township: 'Yangon', passportExpiry: '' })
    const row = await table('customers').get(id)
    expect(row).toMatchObject({ name: 'Ko Aung', _dirty: 1, _rev: 1 })
    expect(await store.pendingCount()).toBe(1)
  })

  it('patch bumps the edit counter and removes fields set to undefined', async () => {
    const cid = await store.create('customers', { name: 'A', phone: '', township: 'Yangon', passportExpiry: '' })
    const id = await store.create('visas', { customerId: cid, kind: 'India', stage: 'Approved', appliedAt: '2024-01-01', decidedAt: '2024-01-05', fee: 1, cost: 1 })
    await store.patch('visas', id, { stage: 'Submitted', decidedAt: undefined })
    const row = await table('visas').get(id)
    expect(row!._rev).toBe(2)
    expect(row!.stage).toBe('Submitted')
    expect('decidedAt' in row!).toBe(false)
  })

  it('remove is a soft delete that will sync', async () => {
    const id = await store.create('customers', { name: 'A', phone: '', township: 'Yangon', passportExpiry: '' })
    await store.remove('customers', id)
    expect(await table('customers').get(id)).toMatchObject({ deleted: true, _dirty: 1 })
    expect((await store.snapshot()).customers).toEqual([])
  })

  it('replaceAll soft-deletes records that are not in the new data', async () => {
    const keep = await store.create('packages', { id: 'IN8', ...pkg })
    const gone = await store.create('packages', { id: 'IN5', ...pkg, days: 5 })
    const data: Data = { customers: [], packages: [{ id: keep, ...pkg, price: 3_000_000 }], bookings: [], visas: [], passports: [], tickets: [] }
    await store.replaceAll(data)
    expect(await table('packages').get(gone)).toMatchObject({ deleted: true, _dirty: 1 })
    expect(await table('packages').get(keep)).toMatchObject({ price: 3_000_000, deleted: false, _rev: 2 })
  })

  it('snapshot leaves out local bookkeeping fields', async () => {
    await store.create('packages', { id: 'IN8', ...pkg })
    const [p] = (await store.snapshot()).packages
    expect(Object.keys(p!)).not.toContain('_dirty')
    expect(Object.keys(p!)).not.toContain('_rev')
  })
})
