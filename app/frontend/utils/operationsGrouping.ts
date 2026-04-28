import type { Operation } from '../types'

export type MonthGrouped = Record<string, Record<string, Operation[]>>

export interface YearGrouped {
  '-': { months: Record<number, Operation[]>; types: Record<string, Operation[]> }
  '+': { months: Record<number, Operation[]>; types: Record<string, Operation[]> }
}

export function filterOperationsMonth(operations: Operation[]): MonthGrouped {
  const result: MonthGrouped = { '-': {}, '+': {} }
  for (const op of operations) {
    if (!result[op.sign][op.type.name]) result[op.sign][op.type.name] = []
    result[op.sign][op.type.name].push(op)
  }
  return result
}

export function filterOperationsYear(operations: Operation[]): YearGrouped {
  const result: YearGrouped = {
    '-': { months: {}, types: {} },
    '+': { months: {}, types: {} },
  }
  for (let m = 1; m <= 12; m++) {
    result['-'].months[m] = []
    result['+'].months[m] = []
  }
  for (const op of operations) {
    const sign = op.sign as '+' | '-'
    if (!result[sign].types[op.type.name]) result[sign].types[op.type.name] = []
    result[sign].types[op.type.name].push(op)
    result[sign].months[op.month].push(op)
  }
  return result
}

export function filterByOr(operations: Operation[], field: string, filters: unknown[]): Operation[] {
  return operations.filter((elem) =>
    filters.some((filter) => {
      const match = field.match(/([^.]*)\.(.*)/);
      if (match) {
        const [, parent, child] = match
        return (elem as Record<string, Record<string, unknown>>)[parent]?.[child] ===
          (filter as Record<string, unknown>)[child]
      }
      return (elem as Record<string, unknown>)[field] === filter
    }),
  )
}

export function sumAmounts(operations: Operation[]): number {
  return operations.reduce((acc, op) => acc + op.amount, 0)
}
