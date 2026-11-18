import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore anonymous mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('is authenticated when a token exists, without calling the backend', async () => {
    const payload = btoa(JSON.stringify({ user: { id: 1, name: 'T', email: 't@e.it' } }))
    localStorage.setItem('token', `h.${payload}.s`)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)
    await auth.checkAnonymous()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('is authenticated when there is no token but the backend allows anonymous (users.json returns 200)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as Response)
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    await expect(auth.checkAnonymous()).resolves.toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith('/users.json')
  })

  it('is not authenticated when there is no token and the backend returns 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response)
    const auth = useAuthStore()
    await expect(auth.checkAnonymous()).resolves.toBe(false)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('is not authenticated when the backend check fails (network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'))
    const auth = useAuthStore()
    await expect(auth.checkAnonymous()).resolves.toBe(false)
    expect(auth.isAuthenticated).toBe(false)
  })
})
