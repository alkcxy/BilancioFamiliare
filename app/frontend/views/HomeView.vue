<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useOperationsStore } from '../stores/operations'
import { operationService } from '../services/operationService'
import { filterByOr } from '../utils/operationsGrouping'
import { buildChartData } from '../utils/chartData'
import { currency } from '../utils/format'
import FilterYears from './FilterYears.vue'
import FilterTypes from './FilterTypes.vue'
import BarChart from '../components/charts/BarChart.vue'
import LineChart from '../components/charts/LineChart.vue'
import type { Operation, Type } from '../types'

const store = useOperationsStore()

const allOps = ref<Operation[]>([])
const selectedYears = ref<number[]>([])
const selectedTypes = ref<Type[]>([])

const filteredOps = computed(() =>
  selectedTypes.value.length ? filterByOr(allOps.value, 'type.id', selectedTypes.value) : allOps.value,
)

const chartData = computed(() => buildChartData(filteredOps.value))

async function onYearsChanged(years: number[]) {
  selectedYears.value = years
  if (!years.length) { allOps.value = []; return }
  const results = await Promise.all(years.map((y) => operationService.year(y)))
  allOps.value = results.flat()
}

watch(
  () => selectedYears.value.map((y) => store.byYear.get(y)),
  () => {
    if (!selectedYears.value.length) return
    allOps.value = selectedYears.value.flatMap((y) => store.byYear.get(y) ?? [])
  },
  { deep: true },
)
</script>

<template>
  <div>
    <div class="page-header">
      <h1>Grafici generali</h1>
    </div>

    <FilterYears @changed="onYearsChanged" />
    <FilterTypes @changed="selectedTypes = $event" />

    <div v-if="!allOps.length" class="alert alert-info mt-3">
      Seleziona uno o più anni per visualizzare i grafici.
    </div>

    <template v-else>
      <div class="card border-primary mb-3">
        <div class="card-header bg-primary text-white">
          <h3 class="card-title mb-0">Entrate/Uscite per Anno</h3>
        </div>
        <div class="card-body">
          <BarChart :data="chartData.perYear" />
          <strong class="mt-2 d-block">
            Saldo Totale Ad Oggi (esclusi introiti e spese future):
            {{ currency(chartData.saldoToday) }}
          </strong>
        </div>
      </div>

      <template v-for="(item, i) in chartData.perDayBySign" :key="i">
        <div v-if="item.data.labels.length" class="card border-primary mb-3">
          <div class="card-header bg-primary text-white">
            <h3 class="card-title mb-0">{{ item.cat }} medie giornaliere per tipologia</h3>
          </div>
          <div class="card-body">
            <BarChart :data="item.data" />
          </div>
        </div>
      </template>

      <template v-for="(item, i) in chartData.perMonthBySign" :key="i">
        <div v-if="item.byYear.length" class="card border-primary mb-3">
          <div class="card-header bg-primary text-white">
            <h3 class="card-title mb-0">{{ item.cat }} mensili per tipologia</h3>
          </div>
          <div v-for="yd in item.byYear" :key="yd.year" class="card-body">
            <h4>Anno {{ yd.year }}</h4>
            <LineChart :data="yd.data" />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
