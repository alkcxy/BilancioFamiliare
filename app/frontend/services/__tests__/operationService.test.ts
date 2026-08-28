import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../../stores/operations'
import { op } from '../../__tests__/fixtures/operation'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('../../lib/api', () => ({ api: { get: apiGet } }))

describe('operationService.getList (Ricerca "Lista")', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('groups the unscoped result by year and caches each year separately', async () => {
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

    const store = useOperationsStore()
    expect(store.getYear(2026)).toEqual([op({ id: 1, year: 2026, month: 3 })])
    expect(store.getYear(2024)).toEqual([op({ id: 2, year: 2024, month: 3 })])
  })

  it('does not touch the per-year cache when searching with a key', async () => {
    apiGet.mockImplementation((url: string) =>
      url === '/operations/max.json'
        ? Promise.resolve([])
        : Promise.resolve([op({ id: 1, year: 2026, month: 3 })]),
    )

    const { operationService } = await import('../operationService')
    await operationService.getList('esselunga')

    expect(useOperationsStore().getYear(2026)).toBeUndefined()
  })
})

describe('operationService.year cache revalidation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function serveYear(max: number, ops: ReturnType<typeof op>[]) {
    apiGet.mockImplementation((url: string) =>
      url === '/operations/max.json'
        ? Promise.resolve([{ year: 2026, max, id: 1 }])
        : Promise.resolve(ops),
    )
  }

  it('serves a cached year from the store while its max is unchanged', async () => {
    serveYear(100, [op({ id: 1 })])
    const { operationService } = await import('../operationService')

    await operationService.year(2026)
    const before = apiGet.mock.calls.filter((c) => c[0] === '/operations/year/2026.json').length
    await operationService.year(2026)

    expect(apiGet.mock.calls.filter((c) => c[0] === '/operations/year/2026.json')).toHaveLength(before)
  })

  it('refetches a cached year as soon as its max moves (import, or a broadcast missed while offline)', async () => {
    serveYear(100, [op({ id: 1 })])
    const { operationService } = await import('../operationService')
    await operationService.year(2026)

    serveYear(200, [op({ id: 1 }), op({ id: 2, date: '2026-03-02' })])

    expect(await operationService.year(2026)).toEqual([op({ id: 1 }), op({ id: 2, date: '2026-03-02' })])
  })
})
