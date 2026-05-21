import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LoginView from '../views/LoginView.vue'

const mockPush = vi.fn()
const mockSetToken = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ setToken: mockSetToken, clearToken: vi.fn(), isAuthenticated: false }),
}))

const originalLocation = window.location

function stubLocation(origin = 'http://localhost') {
  delete (globalThis as any).location
  ;(globalThis as any).location = { href: '', origin }
}

describe('LoginView SSO probe (onMounted)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    stubLocation()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    ;(globalThis as any).location = originalLocation
  })

  it('shows spinner while SSO probe is in flight', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    const wrapper = mount(LoginView)
    expect(wrapper.find('.text-muted').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('calls setToken and pushes to / when SSO returns a valid token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      type: 'basic',
      json: () => Promise.resolve({ status: true, token: 'eyJfake' }),
    } as any)
    mount(LoginView)
    await flushPromises()
    expect(mockSetToken).toHaveBeenCalledWith('eyJfake')
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('sets window.location.href to Authelia when response type is opaqueredirect', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, type: 'opaqueredirect' } as any)
    mount(LoginView)
    await flushPromises()
    expect((globalThis as any).location.href).toContain('/authelia')
    expect(mockSetToken).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows the login form when SSO returns a non-200 non-opaqueredirect response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, type: 'basic', status: 404 } as any)
    const wrapper = mount(LoginView)
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(mockSetToken).not.toHaveBeenCalled()
  })

  it('shows the login form when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    const wrapper = mount(LoginView)
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(mockSetToken).not.toHaveBeenCalled()
  })

  it('skips the SSO probe and shows the form immediately when explicit_logout is set', async () => {
    sessionStorage.setItem('explicit_logout', '1')
    const wrapper = mount(LoginView)
    await flushPromises()
    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('removes explicit_logout from sessionStorage after skipping probe', async () => {
    sessionStorage.setItem('explicit_logout', '1')
    mount(LoginView)
    await flushPromises()
    expect(sessionStorage.getItem('explicit_logout')).toBeNull()
  })
})
