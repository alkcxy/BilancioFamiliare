<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { userService } from '../../services/userService'
import type { User } from '../../types'

const route = useRoute()
const user = ref<User | null>(null)

onMounted(async () => { user.value = await userService.get(route.params.id as string) })
</script>

<template>
  <div v-if="user">
    <h1>{{ user.name }}</h1>
    <p>{{ user.email }}</p>
    <span v-if="user.blocked" class="badge bg-danger mb-2">Bloccato</span>
    <br />
    <router-link :to="`/users/${user.id}/edit`" class="btn btn-warning">Modifica</router-link>
    <router-link to="/users" class="btn btn-secondary ms-2">Indietro</router-link>
  </div>
</template>
