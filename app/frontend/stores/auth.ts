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
  const token = ref<string | null>(sessionStorage.getItem('token'))
  const currentUser = ref<CurrentUser | null>(null)

  if (token.value) {
    try {
      currentUser.value = decodeJwtPayload(token.value).user
    } catch {
      token.value = null
      sessionStorage.removeItem('token')
    }
  }

  const isAuthenticated = computed(() => token.value !== null)

  function setToken(rawToken: string) {
    token.value = rawToken
    sessionStorage.setItem('token', rawToken)
    currentUser.value = decodeJwtPayload(rawToken).user
  }

  function clearToken() {
    token.value = null
    currentUser.value = null
    sessionStorage.removeItem('token')
  }

  return { token, currentUser, isAuthenticated, setToken, clearToken }
})
