<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOperationsStore } from '../../stores/operations'
import { operationService } from '../../services/operationService'
import { filterByOr } from '../../utils/operationsGrouping'
import FilterTypes from '../FilterTypes.vue'
import NavigationMonth from './NavigationMonth.vue'
import TitleMonth from './TitleMonth.vue'
import TableMonth from './TableMonth.vue'
import PieChartPerUser from './PieChartPerUser.vue'
import type { Type } from '../../types'

const route = useRoute()
const store = useOperationsStore()

const year = computed(() => parseInt(route.params.year as string))
const month = computed(() => parseInt(route.params.month as string))

const selectedTypes = ref<Type[]>([])
const failed = ref(false)

const allOps = computed(() => (store.byYear.get(year.value) ?? []).filter((o) => o.month === month.value))

const filteredOps = computed(() =>
  selectedTypes.value.length ? filterByOr(allOps.value, 'type.id', selectedTypes.value) : allOps.value,
)

watch(
  [year, month],
  () => {
    failed.value = false
    operationService.month(year.value, month.value).catch(() => {
      failed.value = true
    })
  },
  { immediate: true },
)

async function destroy(id: number) {
  if (!confirm('Sei sicuro?')) return
  await operationService.destroy(id)
}
</script>

<template>
  <div>
    <TitleMonth :year="year" :month="month" />
    <NavigationMonth :year="year" :month="month" />
    <FilterTypes @changed="selectedTypes = $event" />
    <div v-if="failed" class="alert alert-danger">
      Impossibile caricare le operazioni. Ricarica la pagina.
    </div>
    <TableMonth :operations="filteredOps" @destroy="destroy" />
    <PieChartPerUser :operations="filteredOps" />
  </div>
</template>
