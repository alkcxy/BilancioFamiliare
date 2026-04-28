<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { withdrawalService } from '../../services/withdrawalService'
import type { Withdrawal } from '../../types'

const route = useRoute()
const w = ref<Withdrawal | null>(null)

onMounted(async () => { w.value = await withdrawalService.get(route.params.id as string) })
</script>

<template>
  <div v-if="w">
    <h1>Prelievo n. {{ w.id }}</h1>
    <div v-if="w.complete" class="alert alert-danger">
      Questo prelievo è stato indicato come completo: tutti i soldi prelevati sono stati spesi.
    </div>
    <div v-if="w.archive" class="alert alert-danger">
      Questo prelievo è stato indicato come archiviato: tutti i soldi prelevati sono stati verificati.
    </div>
    <p><strong>Data del ritiro:</strong> {{ w.date }}</p>
    <p><strong>Utente:</strong> {{ w.user.name }}</p>
    <p><strong>Prelevati:</strong> {{ w.amount }}</p>
    <p><strong>Note:</strong><br /><pre>{{ w.note }}</pre></p>
    <router-link :to="`/withdrawals/${w.id}/edit`" class="btn btn-warning">Modifica</router-link>
    <router-link to="/withdrawals" class="btn btn-secondary ms-2">Indietro</router-link>
  </div>
</template>
