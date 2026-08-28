<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOperationsStore } from '../../stores/operations'
import { operationService } from '../../services/operationService'
import { filterByOr } from '../../utils/operationsGrouping'
import FilterTypes from '../FilterTypes.vue'
import NavigationYear from './NavigationYear.vue'
import TitleYear from './TitleYear.vue'
import TableYear from './TableYear.vue'
import PieChartPerUser from './PieChartPerUser.vue'
import type { Operation, Type } from '../../types'

const route = useRoute()
const store = useOperationsStore()

const year = computed(() => parseInt(route.params.year as string))

const allOps = ref<Operation[]>([])
const allOpsPrev = ref<Operation[]>([])
const selectedTypes = ref<Type[]>([])

const filteredOps = computed(() =>
  selectedTypes.value.length ? filterByOr(allOps.value, 'type.id', selectedTypes.value) : allOps.value,
)
const filteredOpsPrev = computed(() =>
  selectedTypes.value.length ? filterByOr(allOpsPrev.value, 'type.id', selectedTypes.value) : allOpsPrev.value,
)

async function loadOps() {
  const [cur, prev] = await Promise.all([
    operationService.year(year.value),
    operationService.year(year.value - 1),
  ])
  allOps.value = cur
  allOpsPrev.value = prev
}

watch(year, loadOps, { immediate: true })

watch(
  () => store.byYear.get(year.value),
  (ops) => { if (ops) allOps.value = ops },
)
watch(
  () => store.byYear.get(year.value - 1),
  (ops) => { if (ops) allOpsPrev.value = ops },
)
</script>

<template>
  <div>
    <TitleYear :year="year" />
    <NavigationYear :year="year" />
    <FilterTypes @changed="selectedTypes = $event" />
    <TableYear :operations="filteredOps" :operations-prev="filteredOpsPrev" :year="year" />
    <PieChartPerUser :operations="filteredOps" />
  </div>
</template>
