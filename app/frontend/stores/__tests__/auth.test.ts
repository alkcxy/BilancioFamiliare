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

  it('reuses the in-flight check (singleflight) on concurrent calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as Response)
    const auth = useAuthStore()
    const [a, b, c] = await Promise.all([auth.checkAnonymous(), auth.checkAnonymous(), auth.checkAnonymous()])
    expect([a, b, c]).toEqual([true, true, true])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not cache a negative result: retries the fetch on next call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
    const auth = useAuthStore()
    await expect(auth.checkAnonymous()).resolves.toBe(false)
    await expect(auth.checkAnonymous()).resolves.toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('clearToken resets anonymous mode and the cached check', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as Response)
    const auth = useAuthStore()
    await auth.checkAnonymous()
    expect(auth.isAuthenticated).toBe(true)
    auth.clearToken()
    expect(auth.isAuthenticated).toBe(false)
    await expect(auth.checkAnonymous()).resolves.toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
