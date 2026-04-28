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
import type { Operation, Type } from '../../types'

const route = useRoute()
const store = useOperationsStore()

const year = computed(() => parseInt(route.params.year as string))
const month = computed(() => parseInt(route.params.month as string))

const allOps = ref<Operation[]>([])
const selectedTypes = ref<Type[]>([])

const filteredOps = computed(() =>
  selectedTypes.value.length ? filterByOr(allOps.value, 'type.id', selectedTypes.value) : allOps.value,
)

async function loadOps() {
  allOps.value = await operationService.month(year.value, month.value)
}

watch([year, month], loadOps, { immediate: true })

watch(
  () => store.byYear.get(year.value),
  (ops) => { if (ops) allOps.value = ops.filter((o) => o.month === month.value) },
)

async function destroy(id: number) {
  if (!confirm('Sei sicuro?')) return
  await operationService.destroy(id)
  allOps.value = allOps.value.filter((o) => o.id !== id)
}
</script>

<template>
  <div>
    <TitleMonth :year="year" :month="month" />
    <NavigationMonth :year="year" :month="month" />
    <FilterTypes @changed="selectedTypes = $event" />
    <TableMonth :operations="filteredOps" @destroy="destroy" />
    <PieChartPerUser :operations="filteredOps" />
  </div>
</template>
