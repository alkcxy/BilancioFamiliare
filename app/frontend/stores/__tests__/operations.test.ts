import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../operations'
import { op } from '../../__tests__/fixtures/operation'

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
