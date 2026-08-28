import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../stores/operations'
import TableYear from '../views/operations/TableYear.vue'
import { op } from './fixtures/operation'

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
    const pending = new Map<number, (ops: ReturnType<typeof op>[]) => void>()
    opYear.mockImplementation(
      (year: number) =>
        new Promise((resolve) => {
          pending.set(year, resolve)
        }),
    )

    const { default: YearView } = await import('../views/operations/YearView.vue')
    const wrapper = mount(YearView, { global: GLOBAL_STUBS })
    await flushPromises()

    route.params.year = '2025'
    await flushPromises()

    const store = useOperationsStore()
    pending.get(2025)?.([op({ id: 2, year: 2025 })])
    store.setYear(2025, [op({ id: 2, year: 2025 })])
    await flushPromises()

    pending.get(2026)?.([op({ id: 1, year: 2026 })])
    store.setYear(2026, [op({ id: 1, year: 2026 })])
    await flushPromises()

    const ops = wrapper.findComponent(TableYear).props('operations')
    expect(ops).toEqual([op({ id: 2, year: 2025 })])
  })
})
