<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

const auth = useAuthStore()
const router = useRouter()

async function login() {
  error.value = null
  try {
    const resp = await fetch('/login.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    const data = await resp.json()
    if (data.status && data.token) {
      auth.setToken(data.token)
      router.push('/')
    } else {
      error.value = 'Email o password non valida.'
    }
  } catch {
    error.value = 'Errore di rete. Riprova.'
  }
}
</script>

<template>
  <div class="row justify-content-center mt-5">
    <div class="col-md-4">
      <h4>Accedi</h4>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <form @submit.prevent="login">
        <div class="mb-2">
          <label for="login-email">Email</label>
          <input id="login-email" v-model="email" type="email" class="form-control" required autofocus />
        </div>
        <div class="mt-2 mb-2">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="password" type="password" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-primary mt-3">Accedi</button>
      </form>
    </div>
  </div>
</template>
