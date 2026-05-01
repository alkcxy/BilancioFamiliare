import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import OperationForm from '../views/operations/OperationForm.vue'

const mocks = vi.hoisted(() => ({
  opPost: vi.fn().mockResolvedValue({ id: 99 }),
  apiPost: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, name: 'Tester', email: 'tester@test.com' } }),
}))

const SPESA_PARENT = { id: 99, name: 'Spesa', description: null, master_type_id: null, master_type: null, created_at: '', updated_at: '', url: '' }

const TYPES = [
  // parent type (has children) — should NOT be selectable
  SPESA_PARENT,
  // standalone leaf (no parent, no children) — selectable
  { id: 1, name: 'Alimentari', description: null, master_type_id: null, master_type: null, created_at: '', updated_at: '', url: '' },
  // child of Spesa — selectable
  { id: 2, name: 'Ristorante', description: null, master_type_id: 99, master_type: SPESA_PARENT, created_at: '', updated_at: '', url: '' },
]

vi.mock('../services/typeService', () => ({
  typeService: { getList: () => Promise.resolve(TYPES) },
}))

vi.mock('../services/userService', () => ({
  userService: {
    getList: () => Promise.resolve([
      { id: 1, name: 'Tester', email: 'a@a.com', blocked: false, created_at: '', updated_at: '', url: '' },
      { id: 2, name: 'Altro', email: 'b@b.com', blocked: false, created_at: '', updated_at: '', url: '' },
    ]),
  },
}))

vi.mock('../services/operationService', () => ({
  operationService: {
    post: mocks.opPost,
    spending_limit_cap: vi.fn().mockReturnValue(null),
    spending_limit_amount: vi.fn().mockReturnValue(null),
    month: vi.fn().mockResolvedValue([]),
    year: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../lib/api', () => ({
  api: { post: mocks.apiPost },
}))

const GLOBAL_STUBS = {
  stubs: {
    FormRepeater: { template: '<div />' },
    RouterLink: { template: '<a><slot /></a>' },
  },
}

async function mountForm() {
  const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
  await flushPromises()
  return wrapper
}

describe('OperationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.opPost.mockResolvedValue({ id: 99 })
    mocks.apiPost.mockResolvedValue([])
  })

  describe('sign inference from negative amount', () => {
    it('sets sign to "-" and flips amount to positive when user types a negative number', async () => {
      const wrapper = await mountForm()

      await wrapper.find('#op-amount').setValue(-42)
      await nextTick()

      expect((wrapper.find('#op-sign').element as HTMLSelectElement).value).toBe('-')
      expect((wrapper.find('#op-amount').element as HTMLInputElement).value).toBe('42')
    })

    it('does not change positive amount or sign', async () => {
      const wrapper = await mountForm()

      await wrapper.find('#op-sign').setValue('+')
      await wrapper.find('#op-amount').setValue(10)
      await nextTick()

      expect((wrapper.find('#op-sign').element as HTMLSelectElement).value).toBe('+')
      expect((wrapper.find('#op-amount').element as HTMLInputElement).value).toBe('10')
    })
  })

  describe('current user pre-fill', () => {
    it('pre-fills userId with the logged-in user on mount', async () => {
      const wrapper = await mountForm()

      expect((wrapper.find('#op-user').element as HTMLSelectElement).value).toBe('1')
    })
  })

  describe('searchable type field', () => {
    it('renders a text input for type search', async () => {
      const wrapper = await mountForm()
      expect(wrapper.find('input#op-type').exists()).toBe(true)
    })

    it('shows grouped dropdown on focus: parent header + children indented, standalone selectable', async () => {
      const wrapper = await mountForm()
      await wrapper.find('#op-type').trigger('focus')
      await nextTick()

      const items = wrapper.findAll('.list-group-item')
      const labels = items.map((i) => i.text())
      // parent header present but not clickable
      expect(labels).toContain('Spesa')
      // child option present (shown as bare name in grouped view)
      expect(labels).toContain('Ristorante')
      // standalone leaf present
      expect(labels).toContain('Alimentari')
    })

    it('parent type header is not selectable (pointer-events: none)', async () => {
      const wrapper = await mountForm()
      await wrapper.find('#op-type').trigger('focus')
      await nextTick()

      const header = wrapper.findAll('.list-group-item').find((i) => i.text() === 'Spesa')
      expect(header?.attributes('style')).toContain('pointer-events')
    })

    it('filters to matching leaves with full prefix when typing', async () => {
      const wrapper = await mountForm()
      await wrapper.find('#op-type').trigger('focus')
      await wrapper.find('#op-type').setValue('Rist')
      await nextTick()

      const items = wrapper.findAll('.list-group-item')
      const labels = items.map((i) => i.text())
      expect(labels).toContain('Spesa > Ristorante')
      expect(labels).not.toContain('Spesa')
    })

    it('hides dropdown after selection', async () => {
      const wrapper = await mountForm()
      await wrapper.find('#op-type').trigger('focus')
      await nextTick()
      await wrapper.find('#op-type').setValue('Alimentari')
      await nextTick()

      expect(wrapper.find('.list-group').exists()).toBe(false)
    })

    it('resolves typeId from exact label match on submit', async () => {
      const wrapper = await mountForm()

      await wrapper.find('#op-type').setValue('Spesa > Ristorante')
      await nextTick()
      await wrapper.find('#op-sign').setValue('-')
      await wrapper.find('#op-amount').setValue(20)
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mocks.opPost).toHaveBeenCalledWith(expect.objectContaining({ type_id: 2 }))
    })
  })

  describe('duplicate detection', () => {
    function setupDuplicateMock(matches: object[] = [], contextual: object[] = []) {
      mocks.apiPost
        .mockResolvedValueOnce([{ index: 0, matches }])
        .mockResolvedValueOnce(contextual)
    }

    it('triggers after debounce when only typeId is set (no amount yet)', async () => {
      vi.useFakeTimers()
      setupDuplicateMock()

      const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
      await flushPromises()

      await wrapper.find('#op-type').setValue('Alimentari')
      await nextTick()

      vi.advanceTimersByTime(700)
      await flushPromises()

      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/operations/check_duplicates.json',
        expect.objectContaining({ rows: expect.any(Array) }),
      )
      vi.useRealTimers()
    })

    it('calls check_contextual automatically after check_duplicates', async () => {
      vi.useFakeTimers()
      setupDuplicateMock()

      const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
      await flushPromises()

      await wrapper.find('#op-amount').setValue(42)
      await nextTick()

      vi.advanceTimersByTime(700)
      await flushPromises()

      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/operations/check_contextual.json',
        expect.objectContaining({ row: expect.any(Object), exclude_ids: expect.any(Array) }),
      )
      vi.useRealTimers()
    })

    it('shows probable duplicate alert when API returns a probable match', async () => {
      vi.useFakeTimers()
      const match = { id: 1, amount: 42, date: '2025-01-01', note: 'Esselunga', kind: 'probable' as const }
      setupDuplicateMock([match])

      const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
      await flushPromises()

      await wrapper.find('#op-amount').setValue(42)
      await nextTick()

      vi.advanceTimersByTime(700)
      await flushPromises()

      expect(wrapper.text()).toContain('Probabile duplicato')
      vi.useRealTimers()
    })

    it('shows "da verificare" alert for possible matches', async () => {
      vi.useFakeTimers()
      const match = { id: 2, amount: 42, date: '2025-01-02', note: 'Esselunga', kind: 'possible' as const }
      setupDuplicateMock([match])

      const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
      await flushPromises()

      await wrapper.find('#op-amount').setValue(42)
      await nextTick()

      vi.advanceTimersByTime(700)
      await flushPromises()

      expect(wrapper.text()).toContain('Da verificare')
      vi.useRealTimers()
    })

    it('shows contextual matches with "Stesso mese" badge', async () => {
      vi.useFakeTimers()
      const ctx = { id: 5, amount: 40, date: '2025-01-10', note: 'Lidl', kind: 'contextual' as const }
      setupDuplicateMock([], [ctx])

      const wrapper = mount(OperationForm, { global: GLOBAL_STUBS })
      await flushPromises()

      await wrapper.find('#op-amount').setValue(42)
      await nextTick()

      vi.advanceTimersByTime(700)
      await flushPromises()

      expect(wrapper.text()).toContain('Stesso mese')
      vi.useRealTimers()
    })
  })
})
