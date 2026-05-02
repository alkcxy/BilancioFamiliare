<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useOperationsStore } from './stores/operations'
import { operationService } from './services/operationService'
import { connectCable, disconnectCable } from './lib/cable'

const route = useRoute()
const auth = useAuthStore()
const opsStore = useOperationsStore()
const openMenu = ref<string | null>(null)
const navOpen = ref(false)

const years = computed(() =>
  [...opsStore.maxByYear].map((e) => e.year).sort((a, b) => b - a),
)

function toggle(menu: string) {
  openMenu.value = openMenu.value === menu ? null : menu
}

function close() {
  openMenu.value = null
  navOpen.value = false
}

onMounted(async () => {
  if (auth.isAuthenticated) {
    connectCable()
    await operationService.getMax()
  }
})

watch(
  () => auth.isAuthenticated,
  async (authenticated) => {
    if (authenticated) {
      connectCable()
      await operationService.getMax()
    } else {
      disconnectCable()
    }
  },
)
</script>

<template>
  <div class="container" @click.self="close">
    <nav v-if="auth.isAuthenticated" class="navbar navbar-expand-lg navbar-light bg-light mb-3 px-2">
      <router-link to="/" class="navbar-brand" @click="close">Bilancio</router-link>

      <button class="navbar-toggler ms-auto" type="button" @click.stop="navOpen = !navOpen; openMenu = null">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" :class="{ show: navOpen }">
        <div class="navbar-nav me-auto">

          <!-- Utenti -->
          <div class="nav-item dropdown" :class="{ show: openMenu === 'users' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggle('users')">Utenti</a>
            <div class="dropdown-menu" :class="{ show: openMenu === 'users' }">
              <router-link to="/users" class="dropdown-item" @click="close">Lista</router-link>
              <router-link to="/users/new" class="dropdown-item" @click="close">Nuovo utente</router-link>
            </div>
          </div>

          <!-- Operazioni -->
          <div class="nav-item dropdown" :class="{ show: openMenu === 'ops' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggle('ops')">Operazioni</a>
            <div class="dropdown-menu" :class="{ show: openMenu === 'ops' }">
              <router-link to="/operations" class="dropdown-item" @click="close">Lista</router-link>
              <router-link to="/operations/new" class="dropdown-item" @click="close">Nuova operazione</router-link>
              <router-link to="/operations/import" class="dropdown-item" @click="close">Importa da estratto conto</router-link>
            </div>
          </div>

          <!-- Categorie -->
          <div class="nav-item dropdown" :class="{ show: openMenu === 'types' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggle('types')">Categorie</a>
            <div class="dropdown-menu" :class="{ show: openMenu === 'types' }">
              <router-link to="/types" class="dropdown-item" @click="close">Lista</router-link>
              <router-link to="/types/new" class="dropdown-item" @click="close">Nuova categoria</router-link>
            </div>
          </div>

          <!-- Prelievi -->
          <div class="nav-item dropdown" :class="{ show: openMenu === 'withdrawals' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggle('withdrawals')">Prelievi</a>
            <div class="dropdown-menu" :class="{ show: openMenu === 'withdrawals' }">
              <router-link to="/withdrawals" class="dropdown-item" @click="close">Lista</router-link>
              <router-link to="/withdrawals/all" class="dropdown-item" @click="close">Tutti</router-link>
              <router-link to="/withdrawals/archive" class="dropdown-item" @click="close">Archivio</router-link>
              <div class="dropdown-divider"></div>
              <router-link to="/withdrawals/new" class="dropdown-item" @click="close">Nuovo prelievo</router-link>
            </div>
          </div>

          <!-- Anno -->
          <div class="nav-item dropdown" :class="{ show: openMenu === 'year' }">
            <a class="nav-link dropdown-toggle" href="#" @click.prevent="toggle('year')">Anno</a>
            <div class="dropdown-menu" :class="{ show: openMenu === 'year' }">
              <router-link
                v-for="y in years"
                :key="y"
                :to="`/operations/year/${y}`"
                class="dropdown-item"
                @click="close"
              >{{ y }}</router-link>
            </div>
          </div>

        </div>

        <div class="navbar-nav">
          <span class="nav-link text-muted">{{ auth.currentUser?.name }}</span>
          <router-link to="/logout" class="nav-link text-danger" @click="close">Esci</router-link>
        </div>
      </div>
    </nav>

    <router-view :key="route.fullPath" @click="close" />

    <router-link
      v-if="auth.isAuthenticated && route.name !== 'operations-new'"
      to="/operations/new"
      class="btn btn-primary rounded-circle shadow"
      style="position:fixed; bottom:1.5rem; right:1.5rem; width:3.5rem; height:3.5rem; font-size:1.75rem; line-height:1; display:flex; align-items:center; justify-content:center; z-index:1040;"
      title="Nuova operazione"
      @click="close"
    >+</router-link>
  </div>
</template>
