import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ImportView from '../views/operations/ImportView.vue'

const mocks = vi.hoisted(() => ({
  bulkCreate: vi.fn(),
  opPut: vi.fn(),
  wdPost: vi.fn(),
  wdPut: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, name: 'Tester' }, token: 'tok' }),
}))

vi.mock('../services/typeService', () => ({
  typeService: { getList: () => Promise.resolve([{ id: 1, name: 'Spesa alimentare' }]) },
}))

vi.mock('../services/userService', () => ({
  userService: { getList: () => Promise.resolve([{ id: 1, name: 'Tester' }]) },
}))

vi.mock('../services/operationService', () => ({
  operationService: { bulkCreate: mocks.bulkCreate, put: mocks.opPut },
}))

vi.mock('../services/withdrawalService', () => ({
  withdrawalService: { post: mocks.wdPost, put: mocks.wdPut },
}))

vi.mock('../lib/api', () => ({
  api: { post: mocks.apiPost },
}))

type DuplicateMatch = { id: number; amount: number; date: string; note: string; kind: 'probable' | 'possible' }
type Row = { date: string; note: string; sign: '+' | '-'; amount: string; typeId: number | null; userId: number | null; selected: boolean; duplicate: DuplicateMatch | null; updateExisting: boolean }
type WdRow = { date: string; amount: string; note: string; userId: number | null; selected: boolean; complete: boolean; archive: boolean; duplicate: DuplicateMatch | null; updateExisting: boolean }

function makeRow(note = 'Esselunga', overrides: Partial<Row> = {}): Row {
  return { date: '2024-01-15', note, sign: '-', amount: '42.50', typeId: 1, userId: 1, selected: true, duplicate: null, updateExisting: false, ...overrides }
}

function makeWdRow(note = 'ATM Bancomat', overrides: Partial<WdRow> = {}): WdRow {
  return { date: '2024-01-15', amount: '100', note, userId: 1, selected: true, complete: false, archive: false, duplicate: null, updateExisting: false, ...overrides }
}

const DUPLICATE: DuplicateMatch = { id: 77, amount: 42.5, date: '2024-01-15', note: 'existing', kind: 'probable' }

async function mountView() {
  const wrapper = mount(ImportView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

describe('ImportView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.apiPost.mockResolvedValue([])
    mocks.bulkCreate.mockResolvedValue({
      created: 1,
      operations: [{ id: 1, date: '2024-01-15', note: 'Normal row', amount: 42.5, sign: '-', type: { name: 'Spesa alimentare' }, user: { name: 'Tester' } }],
    })
    mocks.opPut.mockResolvedValue({ id: 77, date: '2024-01-15', note: 'Duplicate row', amount: 42.5, sign: '-', type: { name: 'Spesa alimentare' }, user: { name: 'Tester' } })
    mocks.wdPost.mockResolvedValue({ id: 10, date: '2024-01-15', note: 'normal', amount: 100, year: 2024, month: 1, day: 15 })
    mocks.wdPut.mockResolvedValue({ id: 20, date: '2024-01-15', note: 'updated', amount: 50, year: 2024, month: 1, day: 15 })
  })

  // ── autoDeselectInternal ──────────────────────────────────────────────────

  describe('autoDeselectInternal', () => {
    it('deselects rows whose note starts with "Da "', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Da BancaSella'), makeRow('Esselunga'))
      vm.autoDeselectInternal()
      await nextTick()
      expect(vm.rows[0].selected).toBe(false)
      expect(vm.rows[1].selected).toBe(true)
    })

    it('deselects rows whose note starts with "A " (case-insensitive)', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('a Postepay'), makeRow('Altra spesa'))
      vm.autoDeselectInternal()
      await nextTick()
      expect(vm.rows[0].selected).toBe(false)
      expect(vm.rows[1].selected).toBe(true)
    })

    it('does not deselect rows that do not match the internal transfer pattern', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Amazon'), makeRow('Dasani acqua'))
      vm.autoDeselectInternal()
      await nextTick()
      expect(vm.rows[0].selected).toBe(true)
      expect(vm.rows[1].selected).toBe(true)
    })
  })

  // ── checkDuplicates — updateExisting exclusion ────────────────────────────

  describe('checkDuplicates', () => {
    it('excludes rows with updateExisting=true from the API payload', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.checkDuplicates()
      const sentRows = mocks.apiPost.mock.calls[0][1].rows
      expect(sentRows).toHaveLength(1)
    })

    it('does not clear the duplicate of a row with updateExisting=true', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[1].duplicate).toEqual(DUPLICATE)
    })
  })

  describe('checkWithdrawalDuplicates', () => {
    it('excludes withdrawal rows with updateExisting=true from the API payload', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.withdrawalRows.push(
        makeWdRow('Normal ATM'),
        makeWdRow('Linked ATM', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.checkWithdrawalDuplicates()
      const sentRows = mocks.apiPost.mock.calls[0][1].rows
      expect(sentRows).toHaveLength(1)
    })
  })

  // ── onOpUpdateExistingChange ──────────────────────────────────────────────

  describe('onOpUpdateExistingChange', () => {
    it('selects the row when updateExisting becomes true', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Esselunga', { selected: false, duplicate: DUPLICATE, updateExisting: true })
      vm.onOpUpdateExistingChange(row)
      expect(row.selected).toBe(true)
    })

    it('clears the duplicate when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { duplicate: DUPLICATE, updateExisting: false }))
      const row = vm.rows[0] as Row
      vm.onOpUpdateExistingChange(row)
      await nextTick()
      expect(row.duplicate).toBeNull()
    })

    it('triggers checkDuplicates when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { duplicate: DUPLICATE, updateExisting: false }))
      const row = vm.rows[0] as Row
      vm.onOpUpdateExistingChange(row)
      await flushPromises()
      expect(mocks.apiPost).toHaveBeenCalledWith('/operations/check_duplicates.json', expect.any(Object))
    })
  })

  describe('onWdUpdateExistingChange', () => {
    it('selects the withdrawal row when updateExisting becomes true', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeWdRow('ATM', { selected: false, duplicate: DUPLICATE, updateExisting: true })
      vm.onWdUpdateExistingChange(row)
      expect(row.selected).toBe(true)
    })

    it('clears duplicate and triggers checkWithdrawalDuplicates when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.withdrawalRows.push(makeWdRow('ATM', { duplicate: DUPLICATE, updateExisting: false }))
      const row = vm.withdrawalRows[0] as WdRow
      vm.onWdUpdateExistingChange(row)
      await flushPromises()
      expect(row.duplicate).toBeNull()
      expect(mocks.apiPost).toHaveBeenCalledWith('/withdrawals/check_duplicates.json', expect.any(Object))
    })
  })

  // ── submit: create vs update split ───────────────────────────────────────

  describe('submit', () => {
    it('calls bulkCreate only for rows without updateExisting', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.submit()
      await flushPromises()
      const bulkPayload: any[] = mocks.bulkCreate.mock.calls[0][0]
      expect(bulkPayload).toHaveLength(1)
      expect(bulkPayload[0].note).toBe('Normal row')
    })

    it('calls operationService.put with correct id for rows with updateExisting', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.submit()
      await flushPromises()
      expect(mocks.opPut).toHaveBeenCalledWith(77, expect.objectContaining({ note: 'Linked row' }))
    })

    it('calls withdrawalService.post for normal rows and put for updateExisting ones', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.withdrawalRows.push(
        makeWdRow('Normal ATM'),
        makeWdRow('Existing ATM', { duplicate: { ...DUPLICATE, id: 20 }, updateExisting: true }),
      )
      await vm.submit()
      await flushPromises()
      expect(mocks.wdPost).toHaveBeenCalledWith(expect.objectContaining({ note: 'Normal ATM' }))
      expect(mocks.wdPut).toHaveBeenCalledWith(20, expect.objectContaining({ note: 'Existing ATM' }))
    })

    it('marks created ops as action="created" and updated ops as action="updated"', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicate: DUPLICATE }),
      )
      await vm.submit()
      await flushPromises()
      const result = vm.savedResult
      const created = result.operations.find((o: any) => o.note === 'Normal row')
      const updated = result.operations.find((o: any) => o.note === 'Duplicate row')
      expect(created?.action).toBe('created')
      expect(updated?.action).toBe('updated')
    })
  })
})
