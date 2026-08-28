import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../operations'
import { op } from '../../__tests__/fixtures/operation'
import type { CablePayload } from '../../types'

describe('useOperationsStore.setYear', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('drops operations that do not belong to the given year, protecting every reader of byYear', () => {
    const store = useOperationsStore()

    store.setYear(2026, [
      op({ id: 1, year: 2026 }),
      op({ id: 2, year: 2024 }),
    ])

    expect(store.getYear(2026)).toEqual([op({ id: 1, year: 2026 })])
  })
})

describe('useOperationsStore.applyUpdate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('moves an operation out of its old year when the update broadcasts only the new one', () => {
    const store = useOperationsStore()
    store.setYear(2026, [op({ id: 1, year: 2026, month: 3, date: '2026-03-05' })])
    store.setYear(2025, [])

    const moved = op({ id: 1, year: 2025, month: 11, date: '2025-11-02' })
    store.applyUpdate({ method: 'update', message: moved, year: 2025, max: 0 })

    expect(store.getYear(2026)).toEqual([])
    expect(store.getYear(2025)).toEqual([moved])
  })

  it('updates in place without reordering when the year does not change', () => {
    const store = useOperationsStore()
    store.setYear(2026, [
      op({ id: 1, year: 2026, month: 1, date: '2026-01-10' }),
      op({ id: 2, year: 2026, month: 2, date: '2026-02-10' }),
    ])

    const edited = op({ id: 1, year: 2026, month: 1, date: '2026-01-10', amount: 99 })
    store.applyUpdate({ method: 'update', message: edited, year: 2026, max: 0 })

    expect(store.getYear(2026)).toEqual([edited, op({ id: 2, year: 2026, month: 2, date: '2026-02-10' })])
  })

  it('survives a payload without a message (bulk_create) instead of throwing in the cable handler', () => {
    const store = useOperationsStore()
    store.setYear(2026, [op({ id: 1, year: 2026 })])

    expect(() =>
      store.applyUpdate({ method: 'bulk_create', year: 2026, max: 99 } as unknown as CablePayload),
    ).not.toThrow()
    expect(store.getYear(2026)).toEqual([op({ id: 1, year: 2026 })])
  })
})
