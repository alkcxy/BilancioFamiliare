<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { typeService } from '../../services/typeService'
import type { Type } from '../../types'

const route = useRoute()
const type = ref<Type | null>(null)

onMounted(async () => {
  type.value = await typeService.get(route.params.id as string)
})
</script>

<template>
  <div v-if="type">
    <h1>{{ type.name }}</h1>
    <p>{{ type.description }}</p>
    <p v-if="type.master_type?.id !== type.id && type.master_type?.name">
      Tipologia padre: <strong>{{ type.master_type?.name }}</strong>
    </p>
    <p v-if="type.spending_roof">
      Tetto di Spesa mensile: {{ type.spending_roof }}
    </p>
    <div v-for="(limit, key) in type.spending_limit" :key="key">
      {{ limit.month }} - {{ limit.amount }} €
    </div>
    <router-link :to="`/types/${type.id}/edit`" class="btn btn-warning mt-2">Modifica</router-link>
    <router-link to="/types" class="btn btn-secondary mt-2 ms-2">Indietro</router-link>
  </div>
</template>
