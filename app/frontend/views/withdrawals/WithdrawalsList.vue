<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withdrawalService } from '../../services/withdrawalService'
import { currency } from '../../utils/format'
import type { Withdrawal } from '../../types'

const withdrawals = ref<Withdrawal[]>([])

onMounted(async () => { withdrawals.value = await withdrawalService.getList() })

async function destroy(id: number) {
  if (!confirm('Eliminare questo prelievo?')) return
  await withdrawalService.destroy(id)
  withdrawals.value = withdrawals.value.filter((w) => w.id !== id)
}
</script>

<template>
  <div>
    <h1>Prelievi</h1>
    <table class="table table-striped table-hover">
      <thead><tr><th>Data</th><th>Note</th><th>Utente</th><th>Importo</th><th colspan="3"></th></tr></thead>
      <tbody>
        <tr v-for="w in withdrawals" :key="w.id">
          <td>{{ w.date }}</td>
          <td><pre>{{ w.note }}</pre></td>
          <td>{{ w.user.name }}</td>
          <td>{{ currency(w.amount) }}</td>
          <td><router-link :to="`/withdrawals/${w.id}`" class="btn btn-sm btn-primary">&#9432;</router-link></td>
          <td><router-link :to="`/withdrawals/${w.id}/edit`" class="btn btn-sm btn-warning">✏</router-link></td>
          <td><button class="btn btn-sm btn-danger" @click="destroy(w.id)">🗑</button></td>
        </tr>
      </tbody>
    </table>
    <router-link to="/withdrawals/all" class="d-block mb-1">Mostra anche i prelievi spesi e non archiviati</router-link>
    <router-link to="/withdrawals/archive" class="d-block mb-1">Mostra solo i prelievi archiviati</router-link>
    <router-link to="/withdrawals/new" class="btn btn-primary mt-2">Nuovo Prelievo</router-link>
  </div>
</template>
