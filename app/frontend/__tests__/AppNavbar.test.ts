import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { reactive } from 'vue'
import App from '../App.vue'

const mockRoute = reactive({
  params: {} as Record<string, string>,
  fullPath: '/',
  name: undefined as string | undefined,
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ isAuthenticated: true, currentUser: { name: 'Test' } }),
}))

vi.mock('../stores/operations', () => ({
  useOperationsStore: () => ({ maxByYear: [{ year: 2025 }, { year: 2026 }] }),
}))

vi.mock('../services/operationService', () => ({
  operationService: { getMax: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../lib/cable', () => ({
  connectCable: vi.fn(),
  disconnectCable: vi.fn(),
}))

function mountApp(params: Record<string, string> = {}) {
  mockRoute.params = params
  return mount(App, {
    global: {
      stubs: { RouterLink: RouterLinkStub, RouterView: true },
    },
  })
}

function dropdownToggles(wrapper: ReturnType<typeof mountApp>) {
  return wrapper.findAll('a.dropdown-toggle').map((a) => a.text())
}

describe('App navbar year/month selection', () => {
  beforeEach(() => {
    mockRoute.params = {}
    mockRoute.fullPath = '/'
    mockRoute.name = undefined
  })

  it('shows generic labels and links months to the current year by default', () => {
    const wrapper = mountApp()
    const toggles = dropdownToggles(wrapper)
    expect(toggles).toContain('Anno')
    expect(toggles).toContain('Mese')

    const currentYear = new Date().getFullYear()
    const monthLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .map((l) => l.props('to'))
      .filter((to) => /^\/operations\/\d{4}\/\d{2}$/.test(String(to)))
    expect(monthLinks).toHaveLength(12)
    expect(monthLinks[1]).toBe(`/operations/${currentYear}/02`)
  })

  it('shows year and month names on a month route', () => {
    const wrapper = mountApp({ year: '2026', month: '02' })
    const toggles = dropdownToggles(wrapper)
    expect(toggles).toContain('2026')
    expect(toggles).toContain('Febbraio')
  })

  it('shows the year and a generic month on a year route, linking months to that year', () => {
    const wrapper = mountApp({ year: '2025' })
    const toggles = dropdownToggles(wrapper)
    expect(toggles).toContain('2025')
    expect(toggles).toContain('Mese')

    const monthLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .map((l) => l.props('to'))
      .filter((to) => /^\/operations\/\d{4}\/\d{2}$/.test(String(to)))
    expect(monthLinks[8]).toBe('/operations/2025/09')
  })

  it('lists every month of the year in the dropdown', () => {
    const wrapper = mountApp()
    const names = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((l) => /^\/operations\/\d{4}\/\d{2}$/.test(String(l.props('to'))))
      .map((l) => l.text())
    expect(names).toEqual([
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ])
  })

  it('resets both labels on unrelated routes', () => {
    const wrapper = mountApp({ id: '42' })
    const toggles = dropdownToggles(wrapper)
    expect(toggles).toContain('Anno')
    expect(toggles).toContain('Mese')
  })
})
