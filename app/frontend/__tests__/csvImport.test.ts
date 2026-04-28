import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseCsv, inferSign } from '../lib/csvParser'

describe('parseCsv', () => {
  it('detects semicolon separator and returns rows', () => {
    const { headers, rows } = parseCsv('Data;Nota;Importo\n2024-01-15;Esselunga;-42.50\n2024-01-20;Stipendio;1500.00')
    expect(headers).toEqual(['Data', 'Nota', 'Importo'])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual(['2024-01-15', 'Esselunga', '-42.50'])
    expect(rows[1]).toEqual(['2024-01-20', 'Stipendio', '1500.00'])
  })

  it('detects comma separator and returns rows', () => {
    const { headers, rows } = parseCsv('Data,Nota,Importo\n2024-01-15,Esselunga,-42.50')
    expect(headers).toEqual(['Data', 'Nota', 'Importo'])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(['2024-01-15', 'Esselunga', '-42.50'])
  })

  it('skips empty lines', () => {
    const { rows } = parseCsv('A;B\n1;2\n\n3;4')
    expect(rows).toHaveLength(2)
  })
})

describe('inferSign', () => {
  it('returns sign - and absolute amount for negative value', () => {
    expect(inferSign('-42.50')).toEqual({ sign: '-', amount: '42.50' })
  })

  it('returns sign + and value for positive amount', () => {
    expect(inferSign('1500.00')).toEqual({ sign: '+', amount: '1500.00' })
  })

  it('handles comma as decimal separator', () => {
    expect(inferSign('-42,50')).toEqual({ sign: '-', amount: '42.50' })
  })
})

describe('operationService.bulkCreate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../lib/api', () => ({ api: { post: vi.fn().mockResolvedValue({ created: 1 }) } }))
    vi.doMock('../stores/operations', () => ({ useOperationsStore: () => ({ setMax: vi.fn(), setYear: vi.fn() }) }))
  })

  it('posts to /operations/bulk.json with operations array', async () => {
    const { api } = await import('../lib/api')
    const { operationService } = await import('../services/operationService')
    const ops = [{ date: '2024-01-15', sign: '-' as const, amount: 42.50, type_id: 1, user_id: 1 }]
    await operationService.bulkCreate(ops)
    expect(api.post).toHaveBeenCalledWith('/operations/bulk.json', { operations: ops })
  })
})

describe('operationService.put', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../lib/api', () => ({ api: { patch: vi.fn().mockResolvedValue({}) } }))
    vi.doMock('../stores/operations', () => ({ useOperationsStore: () => ({ setMax: vi.fn(), setYear: vi.fn() }) }))
  })

  it('patches /operations/:id.json with operation payload', async () => {
    const { api } = await import('../lib/api')
    const { operationService } = await import('../services/operationService')
    const op = { date: '2024-01-15', sign: '-' as const, amount: 42.50, type_id: 1, user_id: 1 }
    await operationService.put(99, op)
    expect(api.patch).toHaveBeenCalledWith('/operations/99.json', { operation: op })
  })
})

describe('withdrawalService.put', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../lib/api', () => ({ api: { patch: vi.fn().mockResolvedValue({}) } }))
  })

  it('patches /withdrawals/:id.json with withdrawal payload', async () => {
    const { api } = await import('../lib/api')
    const { withdrawalService } = await import('../services/withdrawalService')
    const w = { date: '2024-01-15', amount: 100, user_id: 1 }
    await withdrawalService.put(42, w)
    expect(api.patch).toHaveBeenCalledWith('/withdrawals/42.json', { withdrawal: w })
  })
})
