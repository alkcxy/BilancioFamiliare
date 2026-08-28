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
import type { Type } from '../../types'

const route = useRoute()
const store = useOperationsStore()

const year = computed(() => parseInt(route.params.year as string))

const selectedTypes = ref<Type[]>([])

const allOps = computed(() => store.byYear.get(year.value) ?? [])
const allOpsPrev = computed(() => store.byYear.get(year.value - 1) ?? [])

const filteredOps = computed(() =>
  selectedTypes.value.length ? filterByOr(allOps.value, 'type.id', selectedTypes.value) : allOps.value,
)
const filteredOpsPrev = computed(() =>
  selectedTypes.value.length ? filterByOr(allOpsPrev.value, 'type.id', selectedTypes.value) : allOpsPrev.value,
)

watch(
  year,
  () => {
    operationService.year(year.value)
    operationService.year(year.value - 1)
  },
  { immediate: true },
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
