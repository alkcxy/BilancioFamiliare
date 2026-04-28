<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { operationService } from '../../services/operationService'
import type { Operation } from '../../types'

const route = useRoute()
const router = useRouter()
const op = ref<Operation | null>(null)

onMounted(async () => {
  const data = await operationService.get(route.params.id as string)
  data.date = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`
  op.value = data
})

async function destroy() {
  if (!confirm('Sei sicuro?')) return
  const { year, month } = op.value!
  await operationService.destroy(op.value!.id)
  router.push(`/operations/${year}/${String(month).padStart(2, '0')}`)
}
</script>

<template>
  <div v-if="op">
    <h1>Operazione numero {{ op.id }}</h1>
    <ul>
      <li><strong>Data:</strong> {{ op.date }}</li>
      <li><strong>Tipo:</strong> {{ op.type.name }}</li>
      <li><strong>Utente:</strong> {{ op.user.name }}</li>
      <li><strong>Importo:</strong> {{ op.sign }} {{ op.amount }}</li>
    </ul>
    <p>{{ op.note }}</p>
    <router-link :to="`/operations/${op.id}/edit`" class="btn btn-warning">✏</router-link>
    <button class="btn btn-danger ms-2" @click="destroy">🗑</button>
    <router-link
      :to="`/operations/new?type_id=${op.type_id}&sign=${op.sign}&user_id=${op.user_id}`"
      class="btn btn-info ms-2"
      :title="`Aggiungi operazione di tipo ${op.type.name}`"
    >+</router-link>
  </div>
</template>
