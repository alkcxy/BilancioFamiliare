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

type DuplicateMatch = {
  id: number; amount: number; date: string; note: string; kind: 'probable' | 'possible'
  sign?: string; type_name?: string | null; user_name?: string | null
}
type Row = {
  date: string; note: string; sign: '+' | '-'; amount: string
  typeId: number | null; userId: number | null; selected: boolean
  duplicates: DuplicateMatch[] | null; selectedDuplicate: DuplicateMatch | null
  updateExisting: boolean; checkingDuplicates: boolean
}
type WdRow = {
  date: string; amount: string; note: string; userId: number | null
  selected: boolean; complete: boolean; archive: boolean
  duplicates: DuplicateMatch[] | null; selectedDuplicate: DuplicateMatch | null
  updateExisting: boolean; checkingDuplicates: boolean
}

function makeRow(note = 'Esselunga', overrides: Partial<Row> = {}): Row {
  return { date: '2024-01-15', note, sign: '-', amount: '42.50', typeId: 1, userId: 1, selected: true, duplicates: null, selectedDuplicate: null, updateExisting: false, checkingDuplicates: false, ...overrides }
}

function makeWdRow(note = 'ATM Bancomat', overrides: Partial<WdRow> = {}): WdRow {
  return { date: '2024-01-15', amount: '100', note, userId: 1, selected: true, complete: false, archive: false, duplicates: null, selectedDuplicate: null, updateExisting: false, checkingDuplicates: false, ...overrides }
}

const DUPLICATE: DuplicateMatch = {
  id: 77, amount: 42.5, date: '2024-01-15', note: 'existing', kind: 'probable',
  sign: '-', type_name: 'Spesa alimentare', user_name: 'Tester',
}

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
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
      )
      await vm.checkDuplicates()
      const sentRows = mocks.apiPost.mock.calls[0][1].rows
      expect(sentRows).toHaveLength(1)
    })

    it('does not clear the duplicates of a row with updateExisting=true', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
      )
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[1].duplicates).toEqual([DUPLICATE])
      expect(vm.rows[1].selectedDuplicate).toEqual(DUPLICATE)
    })

    it('sets duplicates and selectedDuplicate from API response', async () => {
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [DUPLICATE] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga'))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[0].duplicates).toEqual([DUPLICATE])
      expect(vm.rows[0].selectedDuplicate).toEqual(DUPLICATE)
    })

    it('auto-selects probable match as selectedDuplicate when multiple matches exist', async () => {
      const possibleMatch: DuplicateMatch = { ...DUPLICATE, id: 88, kind: 'possible' }
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [possibleMatch, DUPLICATE] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga'))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[0].duplicates).toHaveLength(2)
      expect(vm.rows[0].selectedDuplicate?.id).toBe(77) // DUPLICATE (probable)
    })

    it('deselects row when probable duplicate is found', async () => {
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [DUPLICATE] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { selected: true }))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[0].selected).toBe(false)
    })

    it('does not deselect row when only possible duplicate is found', async () => {
      const possibleMatch: DuplicateMatch = { ...DUPLICATE, kind: 'possible' }
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [possibleMatch] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { selected: true }))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.rows[0].selected).toBe(true)
    })

    it('includes skippedRows in the duplicate check payload', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Normal row'))
      vm.skippedRows.push(makeRow('Internal transfer'))
      await vm.checkDuplicates()
      const sentRows = mocks.apiPost.mock.calls[0][1].rows
      expect(sentRows).toHaveLength(2)
    })

    it('assigns duplicates to skippedRows entries from API response', async () => {
      mocks.apiPost.mockResolvedValue([{ index: 1, matches: [{ ...DUPLICATE, kind: 'possible' }] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Normal row'))
      vm.skippedRows.push(makeRow('Internal transfer'))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.skippedRows[0].duplicates).toHaveLength(1)
      expect(vm.skippedRows[0].duplicates[0].kind).toBe('possible')
    })

    it('never auto-selects or auto-deselects skipped rows regardless of duplicate kind', async () => {
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [DUPLICATE] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.skippedRows.push(makeRow('Internal transfer', { selected: false }))
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.skippedRows[0].selected).toBe(false)
      expect(vm.skippedRows[0].duplicates).toHaveLength(1)
    })

    it('closes the modal when checkDuplicates clears duplicates of the currently shown row', async () => {
      mocks.apiPost.mockResolvedValue([])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE })
      vm.rows.push(row)
      vm.openDuplicateModal('operation', row)
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.modalEntry).toBeNull()
    })

    it('closes the modal when checkDuplicates clears duplicates of a shown skipped row', async () => {
      mocks.apiPost.mockResolvedValue([])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Internal transfer', { duplicates: [{ ...DUPLICATE, kind: 'possible' }], selectedDuplicate: DUPLICATE })
      vm.skippedRows.push(row)
      vm.openDuplicateModal('operation', row)
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.modalEntry).toBeNull()
    })

    it('keeps the modal open when the shown row still receives new matches', async () => {
      mocks.apiPost.mockResolvedValue([{ index: 0, matches: [DUPLICATE] }])
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE })
      vm.rows.push(row)
      vm.openDuplicateModal('operation', row)
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
      await vm.checkDuplicates()
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
    })

    it('sets row.checkingDuplicates to true during the call and false after', async () => {
      let capturedDuring = false
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga'))
      const row = vm.rows[0] as Row
      mocks.apiPost.mockImplementation(async () => {
        capturedDuring = row.checkingDuplicates
        return []
      })
      await vm.checkDuplicates()
      expect(capturedDuring).toBe(true)
      expect(row.checkingDuplicates).toBe(false)
    })
  })

  describe('checkWithdrawalDuplicates', () => {
    it('excludes withdrawal rows with updateExisting=true from the API payload', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.withdrawalRows.push(
        makeWdRow('Normal ATM'),
        makeWdRow('Linked ATM', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
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
      const row = makeRow('Esselunga', { selected: false, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: true })
      vm.onOpUpdateExistingChange(row)
      expect(row.selected).toBe(true)
    })

    it('clears duplicates and selectedDuplicate when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: false }))
      const row = vm.rows[0] as Row
      vm.onOpUpdateExistingChange(row)
      await nextTick()
      expect(row.duplicates).toBeNull()
      expect(row.selectedDuplicate).toBeNull()
    })

    it('triggers checkDuplicates when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: false }))
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
      const row = makeWdRow('ATM', { selected: false, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: true })
      vm.onWdUpdateExistingChange(row)
      expect(row.selected).toBe(true)
    })

    it('clears duplicates and triggers checkWithdrawalDuplicates when updateExisting becomes false', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.withdrawalRows.push(makeWdRow('ATM', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: false }))
      const row = vm.withdrawalRows[0] as WdRow
      vm.onWdUpdateExistingChange(row)
      await flushPromises()
      expect(row.duplicates).toBeNull()
      expect(row.selectedDuplicate).toBeNull()
      expect(mocks.apiPost).toHaveBeenCalledWith('/withdrawals/check_duplicates.json', expect.any(Object))
    })
  })

  // ── selectDuplicate ───────────────────────────────────────────────────────

  describe('selectDuplicate', () => {
    it('sets selectedDuplicate and enables updateExisting', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const secondMatch: DuplicateMatch = { ...DUPLICATE, id: 88, kind: 'possible' }
      const row = makeRow('Esselunga', { duplicates: [DUPLICATE, secondMatch], selectedDuplicate: DUPLICATE })
      vm.openDuplicateModal('operation', row)
      await nextTick()
      vm.selectDuplicate(secondMatch)
      expect(row.selectedDuplicate?.id).toBe(88)
      expect(row.updateExisting).toBe(true)
      expect(row.selected).toBe(true)
    })
  })

  // ── Duplicate comparison modal ────────────────────────────────────────────

  describe('openDuplicateModal / closeDuplicateModal', () => {
    it('sets modalEntry when openDuplicateModal is called for an operation row', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE })
      vm.openDuplicateModal('operation', row)
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
      expect(vm.modalEntry.kind).toBe('operation')
      expect(vm.modalEntry.row).toEqual(row)
    })

    it('sets modalEntry when openDuplicateModal is called for a withdrawal row', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeWdRow('ATM', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE })
      vm.openDuplicateModal('withdrawal', row)
      await nextTick()
      expect(vm.modalEntry).not.toBeNull()
      expect(vm.modalEntry.kind).toBe('withdrawal')
    })

    it('clears modalEntry when closeDuplicateModal is called', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.openDuplicateModal('operation', makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }))
      await nextTick()
      vm.closeDuplicateModal()
      await nextTick()
      expect(vm.modalEntry).toBeNull()
    })

    it('syncs updateExisting checkbox in modal with the row', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const row = makeRow('Esselunga', { duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE, updateExisting: false })
      vm.openDuplicateModal('operation', row)
      await nextTick()
      row.updateExisting = true
      vm.onOpUpdateExistingChange(row)
      expect(row.selected).toBe(true)
    })
  })

  // ── submit: create vs update split ───────────────────────────────────────

  describe('submit', () => {
    it('calls bulkCreate only for rows without updateExisting', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Normal row'),
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
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
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
      )
      await vm.submit()
      await flushPromises()
      expect(mocks.opPut).toHaveBeenCalledWith(77, expect.objectContaining({ note: 'Linked row' }))
    })

    it('uses selectedDuplicate.id (not first duplicate) when updating', async () => {
      const secondMatch: DuplicateMatch = { ...DUPLICATE, id: 88, kind: 'possible' }
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      vm.rows.push(
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE, secondMatch], selectedDuplicate: secondMatch }),
      )
      await vm.submit()
      await flushPromises()
      expect(mocks.opPut).toHaveBeenCalledWith(88, expect.any(Object))
    })

    it('calls withdrawalService.post for normal rows and put for updateExisting ones', async () => {
      const wrapper = await mountView()
      const vm = wrapper.vm as any
      const wdDuplicate = { ...DUPLICATE, id: 20 }
      vm.withdrawalRows.push(
        makeWdRow('Normal ATM'),
        makeWdRow('Existing ATM', { duplicates: [wdDuplicate], selectedDuplicate: wdDuplicate, updateExisting: true }),
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
        makeRow('Linked row', { updateExisting: true, duplicates: [DUPLICATE], selectedDuplicate: DUPLICATE }),
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
