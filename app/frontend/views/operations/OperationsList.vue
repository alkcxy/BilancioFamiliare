<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOperationsStore } from '../../stores/operations'
import { operationService } from '../../services/operationService'
import type { Operation } from '../../types'

const store = useOperationsStore()
const localOps = ref<Operation[]>([])
const key = ref('')

function allFromStore(): Operation[] {
  const result: Operation[] = []
  store.maxByYear.forEach((entry) => {
    const ops = store.getYear(entry.year)
    if (ops) result.push(...ops)
  })
  return result.sort((a, b) => b.date.localeCompare(a.date))
}

onMounted(async () => {
  localOps.value = await operationService.getList()
})

watch(
  () => store.maxByYear,
  () => { localOps.value = allFromStore() },
  { deep: true },
)

async function search() {
  localOps.value = await operationService.getList(key.value || undefined)
}

async function destroy(id: number) {
  if (!confirm('Sei sicuro?')) return
  await operationService.destroy(id)
  localOps.value = localOps.value.filter((o) => o.id !== id)
}

const sorted = computed(() =>
  [...localOps.value].sort((a, b) => b.date.localeCompare(a.date)),
)
</script>

<template>
  <div>
    <h1>Ricerca</h1>
    <div class="d-flex gap-2 mb-3">
      <input v-model="key" type="search" class="form-control" placeholder="Ricerca" @keyup.enter="search" />
      <button class="btn btn-info" @click="search">Cerca</button>
    </div>
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Data</th><th>Tipo</th><th>Utente</th><th>Importo</th><th>Note</th><th colspan="3"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="op in sorted" :key="op.id">
          <td>{{ op.date }}</td>
          <td>{{ op.type.name }}</td>
          <td>{{ op.user.name }}</td>
          <td>{{ op.sign === '-' ? -op.amount : op.amount }} €</td>
          <td>{{ op.note }}</td>
          <td><router-link :to="`/operations/${op.id}`" class="btn btn-sm btn-primary">&#9432;</router-link></td>
          <td><router-link :to="`/operations/${op.id}/edit`" class="btn btn-sm btn-warning">✏</router-link></td>
          <td><button class="btn btn-sm btn-danger" @click="destroy(op.id)">🗑</button></td>
        </tr>
      </tbody>
    </table>
    <router-link to="/operations/new" class="btn btn-primary">Nuova operazione</router-link>
  </div>
</template>
