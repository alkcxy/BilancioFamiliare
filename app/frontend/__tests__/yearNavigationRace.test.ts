import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../stores/operations'
import TableYear from '../views/operations/TableYear.vue'
import { op } from './fixtures/operation'
import type { Operation } from '../types'

const route = reactive({ params: { year: '2026' } })

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('../services/typeService', () => ({
  typeService: { getList: () => Promise.resolve([]) },
}))

const opYear = vi.hoisted(() => vi.fn())

vi.mock('../services/operationService', () => ({
  operationService: {
    year: opYear,
    spending_limit_cap: vi.fn().mockReturnValue(null),
    spending_limit_amount: vi.fn().mockReturnValue(null),
  },
}))

const GLOBAL_STUBS = {
  stubs: {
    RouterLink: { template: '<a><slot /></a>' },
    PieChartPerUser: true,
  },
}

describe('YearView vs. out-of-order fetch resolution during rapid navigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    route.params.year = '2026'
  })

  it('keeps the table scoped to the currently selected year even when an older request resolves last', async () => {
    const calls: ((ops: Operation[]) => void)[] = []
    opYear.mockImplementation(
      (year: number) =>
        new Promise<Operation[]>((resolve) => {
          calls.push((ops) => {
            useOperationsStore().setYear(year, ops)
            resolve(ops)
          })
        }),
    )

    const { default: YearView } = await import('../views/operations/YearView.vue')
    const wrapper = mount(YearView, { global: GLOBAL_STUBS })
    await flushPromises()

    calls[1]([op({ id: 2, year: 2025, date: '2025-11-02' })])
    await flushPromises()

    route.params.year = '2025'
    await flushPromises()

    calls[2]([op({ id: 2, year: 2025, date: '2025-11-02' })])
    calls[3]([])
    await flushPromises()

    calls[0]([op({ id: 1, year: 2026, date: '2026-03-01' })])
    await flushPromises()

    const ops = wrapper.findComponent(TableYear).props('operations')
    expect(ops).toEqual([op({ id: 2, year: 2025, date: '2025-11-02' })])
  })
})
