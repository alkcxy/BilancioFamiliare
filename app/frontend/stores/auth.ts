import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CurrentUser {
  id: number
  name: string
  email: string
}

function decodeJwtPayload(token: string): any {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const currentUser = ref<CurrentUser | null>(null)

  if (token.value) {
    try {
      currentUser.value = decodeJwtPayload(token.value).user
    } catch {
      token.value = null
      localStorage.removeItem('token')
    }
  }

  const anonymousMode = ref(false)
  let anonymousCheck: Promise<boolean> | null = null

  const isAuthenticated = computed(() => token.value !== null || anonymousMode.value)

  function checkAnonymous(): Promise<boolean> {
    if (token.value !== null) return Promise.resolve(true)
    if (!anonymousCheck) {
      anonymousCheck = fetch('/users.json')
        .then((r) => r.ok)
        .catch(() => false)
        .then((ok) => {
          anonymousMode.value = ok
          return ok
        })
    }
    return anonymousCheck
  }

  function setToken(rawToken: string) {
    token.value = rawToken
    localStorage.setItem('token', rawToken)
    currentUser.value = decodeJwtPayload(rawToken).user
  }

  function clearToken() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem('token')
    anonymousMode.value = false
    anonymousCheck = null
  }

  return { token, currentUser, isAuthenticated, checkAnonymous, setToken, clearToken }
})
