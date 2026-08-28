import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../../stores/operations'
import type { Operation } from '../../types'

function op(overrides: Partial<Operation>): Operation {
  return {
    id: 1,
    note: '',
    sign: '-',
    amount: 10,
    type_id: 1,
    user_id: 1,
    date: '2026-03-01',
    year: 2026,
    month: 3,
    day: 1,
    type: { id: 1, name: 'Alimentari' },
    user: { id: 1, name: 'Tester' },
    created_at: 0,
    updated_at: 0,
    url: '',
    ...overrides,
  }
}

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('../../lib/api', () => ({ api: { get: apiGet } }))

describe('operationService.getList (Ricerca "Lista")', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not poison the per-year cache with its unscoped, multi-year result', async () => {
    apiGet.mockImplementation((url: string) =>
      url === '/operations/max.json'
        ? Promise.resolve([])
        : Promise.resolve([
            op({ id: 1, year: 2026, month: 3 }),
            op({ id: 2, year: 2024, month: 3 }),
          ]),
    )

    const { operationService } = await import('../operationService')
    await operationService.getList()

    expect(useOperationsStore().getYear(2026)).toBeUndefined()
  })
})
