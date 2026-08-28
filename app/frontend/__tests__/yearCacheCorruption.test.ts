import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useOperationsStore } from '../stores/operations'
import TableYear from '../views/operations/TableYear.vue'
import TableMonth from '../views/operations/TableMonth.vue'
import type { Operation } from '../types'

/**
 * Regression coverage for the production bug: visiting "Lista" (Operazioni > Lista)
 * fetches /operations.json (all years, unscoped) and used to cache the whole result
 * under a single year key. Once that happens, the Anno/Mese views for that year start
 * showing operations from every year, and their totals sum across years too.
 */

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

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { year: '2026', month: '3' } }),
}))

vi.mock('../services/typeService', () => ({
  typeService: { getList: () => Promise.resolve([]) },
}))

const opMocks = vi.hoisted(() => ({ opYear: vi.fn(), opMonth: vi.fn() }))

vi.mock('../services/operationService', () => ({
  operationService: {
    year: opMocks.opYear,
    month: opMocks.opMonth,
    destroy: vi.fn(),
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

describe('year/month views vs. a poisoned per-year cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('YearView keeps totals scoped to the selected year even if the shared cache holds other years too', async () => {
    const { default: YearView } = await import('../views/operations/YearView.vue')
    opMocks.opYear.mockImplementation((y: number) => Promise.resolve(y === 2026 ? [op({ id: 1, year: 2026, month: 3 })] : []))

    const wrapper = mount(YearView, { global: GLOBAL_STUBS })
    await flushPromises()

    // Simulate what OperationsList.getList() does today: an unscoped /operations.json
    // fetch spanning multiple years, cached under the "current" year's key.
    const poisoned = [
      op({ id: 1, year: 2026, month: 3, amount: 10 }),
      op({ id: 2, year: 2024, month: 3, amount: 999 }),
      op({ id: 3, year: 2023, month: 1, amount: 500 }),
    ]
    useOperationsStore().setYear(2026, poisoned)
    await flushPromises()

    const table = wrapper.findComponent(TableYear)
    const ops = table.props('operations') as Operation[]
    expect(ops.every((o) => o.year === 2026)).toBe(true)
  })

  it('MonthView keeps the month table scoped to the selected year even if the shared cache holds other years too', async () => {
    const { default: MonthView } = await import('../views/operations/MonthView.vue')
    opMocks.opMonth.mockResolvedValue([op({ id: 1, year: 2026, month: 3 })])

    const wrapper = mount(MonthView, { global: GLOBAL_STUBS })
    await flushPromises()

    // Same month (March), different year — exactly the reported symptom.
    const poisoned = [
      op({ id: 1, year: 2026, month: 3, amount: 10 }),
      op({ id: 2, year: 2024, month: 3, amount: 999 }),
    ]
    useOperationsStore().setYear(2026, poisoned)
    await flushPromises()

    const table = wrapper.findComponent(TableMonth)
    const ops = table.props('operations') as Operation[]
    expect(ops.every((o) => o.year === 2026)).toBe(true)
  })
})
