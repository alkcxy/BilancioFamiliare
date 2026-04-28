<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { typeService } from '../../services/typeService'
import { currency } from '../../utils/format'
import type { Type } from '../../types'

const types = ref<Type[]>([])

onMounted(async () => {
  types.value = await typeService.getList()
})

async function destroy(id: number) {
  if (!confirm('Eliminare questa categoria?')) return
  await typeService.destroy(id)
  types.value = types.value.filter((t) => t.id !== id)
}
</script>

<template>
  <div>
    <h1>Categorie</h1>
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Descrizione</th>
          <th>Tipo padre</th>
          <th>Tetto Spesa Mens.</th>
          <th colspan="3"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="type in types" :key="type.id">
          <td>{{ type.name }}</td>
          <td>{{ type.description }}</td>
          <td>{{ type.master_type?.id !== type.id ? type.master_type?.name : '' }}</td>
          <td>
            {{ currency(type.spending_roof) }}
            <div v-for="(limit, key) in type.spending_limit" :key="key">
              {{ limit.month }} - {{ currency(limit.amount) }}
            </div>
          </td>
          <td><router-link :to="`/types/${type.id}`" class="btn btn-sm btn-primary">&#9432;</router-link></td>
          <td><router-link :to="`/types/${type.id}/edit`" class="btn btn-sm btn-warning">✏</router-link></td>
          <td><button type="button" class="btn btn-sm btn-danger" @click="destroy(type.id)">🗑</button></td>
        </tr>
      </tbody>
    </table>
    <router-link to="/types/new" class="btn btn-primary">Nuova categoria</router-link>
  </div>
</template>
