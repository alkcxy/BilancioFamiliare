import type { Operation } from '../../types'

export function op(overrides: Partial<Operation>): Operation {
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
