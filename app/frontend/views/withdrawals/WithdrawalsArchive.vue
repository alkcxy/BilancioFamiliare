<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { withdrawalService } from '../../services/withdrawalService'
import { currency } from '../../utils/format'
import type { Withdrawal } from '../../types'

const withdrawals = ref<Withdrawal[]>([])

onMounted(async () => { withdrawals.value = await withdrawalService.getArchive() })

async function destroy(id: number) {
  if (!confirm('Eliminare questo prelievo?')) return
  await withdrawalService.destroy(id)
  withdrawals.value = withdrawals.value.filter((w) => w.id !== id)
}
</script>

<template>
  <div>
    <h1>Prelievi Archiviati</h1>
    <table class="table table-striped table-hover">
      <thead>
        <tr><th>Data</th><th>Note</th><th>Utente</th><th>Importo</th><th>Spendibile</th><th colspan="3"></th></tr>
      </thead>
      <tbody>
        <tr v-for="w in withdrawals" :key="w.id">
          <td>{{ w.date }}</td>
          <td><pre>{{ w.note }}</pre></td>
          <td>{{ w.user.name }}</td>
          <td>{{ currency(w.amount) }}</td>
          <td>
            <span v-if="w.complete" class="badge bg-danger">speso</span>
            <span v-else class="badge bg-success">spendibile</span>
          </td>
          <td><router-link :to="`/withdrawals/${w.id}`" class="btn btn-sm btn-primary">&#9432;</router-link></td>
          <td><router-link :to="`/withdrawals/${w.id}/edit`" class="btn btn-sm btn-warning">✏</router-link></td>
          <td><button class="btn btn-sm btn-danger" @click="destroy(w.id)">🗑</button></td>
        </tr>
      </tbody>
    </table>
    <router-link to="/withdrawals" class="d-block mb-1">Mostra solo i prelievi non spesi</router-link>
    <router-link to="/withdrawals/all" class="d-block mb-1">Mostra tutti i prelievi non archiviati</router-link>
    <router-link to="/withdrawals/new" class="btn btn-primary mt-2">Nuovo Prelievo</router-link>
  </div>
</template>
