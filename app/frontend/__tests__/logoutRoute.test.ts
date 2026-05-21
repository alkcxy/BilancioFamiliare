import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleLogout } from '../router/index'

const mockClearToken = vi.fn()

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ clearToken: mockClearToken, isAuthenticated: false }),
}))

vi.mock('vue-router', () => ({
  createRouter: () => ({ beforeEach: vi.fn() }),
  createWebHashHistory: () => ({}),
}))

const originalLocation = window.location

function stubLocation(origin = 'http://localhost') {
  delete (globalThis as any).location
  ;(globalThis as any).location = { href: '', origin }
}

describe('handleLogout (logout route beforeEnter)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    stubLocation()
    delete (window as any).AUTHELIA_ENABLED
  })

  afterEach(() => {
    ;(globalThis as any).location = originalLocation
  })

  it('always clears the JWT token', () => {
    ;(window as any).AUTHELIA_ENABLED = false
    handleLogout()
    expect(mockClearToken).toHaveBeenCalledOnce()
  })

  it('sets window.location.href to Authelia logout and returns false when AUTHELIA_ENABLED is true', () => {
    ;(window as any).AUTHELIA_ENABLED = true
    const result = handleLogout()
    expect((globalThis as any).location.href).toContain('/authelia/logout')
    expect((globalThis as any).location.href).toContain(encodeURIComponent('http://localhost/'))
    expect(result).toBe(false)
  })

  it('sets explicit_logout flag and returns /login when AUTHELIA_ENABLED is false', () => {
    ;(window as any).AUTHELIA_ENABLED = false
    const result = handleLogout()
    expect(sessionStorage.getItem('explicit_logout')).toBe('1')
    expect(result).toBe('/login')
  })

  it('does not set explicit_logout when AUTHELIA_ENABLED is true', () => {
    ;(window as any).AUTHELIA_ENABLED = true
    handleLogout()
    expect(sessionStorage.getItem('explicit_logout')).toBeNull()
  })

  it('does not redirect to Authelia when AUTHELIA_ENABLED is false', () => {
    ;(window as any).AUTHELIA_ENABLED = false
    handleLogout()
    expect((globalThis as any).location.href).toBe('')
  })
})
