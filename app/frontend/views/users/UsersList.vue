<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '../../services/userService'
import type { User } from '../../types'

const users = ref<User[]>([])

onMounted(async () => { users.value = await userService.getList() })
</script>

<template>
  <div>
    <h1>Utenti</h1>
    <table class="table table-striped table-hover">
      <thead><tr><th>Nome</th><th>Email</th><th colspan="2"></th></tr></thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.email }}</td>
          <td><router-link :to="`/users/${u.id}`" class="btn btn-sm btn-primary">&#9432;</router-link></td>
          <td><router-link :to="`/users/${u.id}/edit`" class="btn btn-sm btn-warning">✏</router-link></td>
        </tr>
      </tbody>
    </table>
    <router-link to="/users/new" class="btn btn-primary">Nuovo utente</router-link>
  </div>
</template>
