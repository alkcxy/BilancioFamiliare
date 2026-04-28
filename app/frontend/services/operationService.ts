import { api } from '../lib/api'
import { useOperationsStore } from '../stores/operations'
import type { Operation, MaxEntry, OperationType } from '../types'

function limitAmount(
  spending_limit: Record<string, { year: number; month: number; amount: number }>,
  opDate: string,
): { year: number; month: number; amount: number } | undefined {
  const date = new Date(opDate)
  const checkers = Object.keys(spending_limit)
    .filter((k) => !isNaN(Number(k)))
    .map((k) => spending_limit[k])
    .filter(
      (entry) =>
        entry.year < date.getFullYear() ||
        (entry.year === date.getFullYear() && entry.month <= date.getMonth() + 1),
    )
    .sort((a, b) => (a.year === b.year ? b.month - a.month : b.year - a.year))
  return checkers[0]
}

export interface OperationPayload {
  date: string
  type_id: number
  user_id: number
  sign: '+' | '-'
  amount: number
  note?: string
  repeat?: 0 | 1
  interval_repeat?: number | string
  type_repeat?: string
  wday_repeat?: string
  week_repeat?: string
  last_date_repeat?: string
}

export const operationService = {
  getMax(): Promise<MaxEntry[]> {
    return api.get<MaxEntry[]>('/operations/max.json').then((data) => {
      useOperationsStore().setMax(data)
      return data
    })
  },

  async getList(key?: string): Promise<Operation[]> {
    await this.getMax()
    const url = key ? `/operations.json?q=${encodeURIComponent(key)}` : '/operations.json'
    const ops = await api.get<Operation[]>(url)
    if (ops.length) useOperationsStore().setYear(ops[0].year, ops)
    return ops
  },

  get: (id: number | string) => api.get<Operation>(`/operations/${id}.json`),

  post: (op: OperationPayload) => api.post<Operation>('/operations.json', { operation: op }),

  put: (id: number | string, op: OperationPayload) =>
    api.patch<Operation>(`/operations/${id}.json`, { operation: op }),

  destroy: (id: number | string) => api.delete<void>(`/operations/${id}.json`).then(() => {
    useOperationsStore().removeOperation(Number(id))
  }),

  async month(year: number, month: number): Promise<Operation[]> {
    await this.getMax()
    const store = useOperationsStore()
    let ops = store.getYear(year)
    if (!ops) {
      ops = await api.get<Operation[]>(`/operations/year/${year}.json`)
      store.setYear(year, ops)
    }
    return ops.filter((o) => o.month === month)
  },

  async year(year: number): Promise<Operation[]> {
    await this.getMax()
    const store = useOperationsStore()
    let ops = store.getYear(year)
    if (!ops) {
      ops = await api.get<Operation[]>(`/operations/year/${year}.json`)
      store.setYear(year, ops)
    }
    return ops
  },

  spending_limit_cap(
    operation: { sign: string; date: string },
    type: Pick<OperationType, 'spending_roof' | 'spending_limit'>,
    totalAmount: number,
  ): 1 | 0 | null {
    if (operation.sign !== '-') return null
    let isl: 1 | -1 | 0 = 0
    if (type.spending_limit) {
      const checker = limitAmount(type.spending_limit, operation.date)
      if (checker) {
        isl = checker.amount < totalAmount ? 1 : -1
        if (isl === 1) return 1
      }
    }
    if (isl === 0 && type.spending_roof && type.spending_roof < totalAmount) return 0
    return null
  },

  spending_limit_amount(
    spending_limit: Record<string, { year: number; month: number; amount: number }>,
    opDate: string,
  ) {
    return limitAmount(spending_limit, opDate)
  },
}
