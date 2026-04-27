<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { connectCable, disconnectCable } from './lib/cable'

const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) connectCable()
})

watch(
  () => auth.isAuthenticated,
  (authenticated) => {
    if (authenticated) {
      connectCable()
    } else {
      disconnectCable()
    }
  },
)
</script>

<template>
  <div class="container">
    <nav v-if="auth.isAuthenticated" class="mb-3 pt-2 d-flex gap-2 align-items-center">
      <router-link to="/" class="btn btn-sm btn-outline-primary">Home</router-link>
      <router-link to="/operations" class="btn btn-sm btn-outline-secondary">Operazioni</router-link>
      <router-link to="/types" class="btn btn-sm btn-outline-secondary">Categorie</router-link>
      <router-link to="/withdrawals" class="btn btn-sm btn-outline-secondary">Prelievi</router-link>
      <router-link to="/users" class="btn btn-sm btn-outline-secondary">Utenti</router-link>
      <span class="ms-auto text-muted small">{{ auth.currentUser?.name }}</span>
      <router-link to="/logout" class="btn btn-sm btn-outline-danger">Esci</router-link>
    </nav>
    <router-view />
  </div>
</template>
