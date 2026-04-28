<script setup lang="ts">
import { computed } from 'vue'
import DoughnutChart from '../../components/charts/DoughnutChart.vue'
import type { Operation } from '../../types'

const props = defineProps<{ operations: Operation[] }>()

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC8A4']

function buildCharts(ops: Operation[], user: string) {
  const bySign: Record<string, Operation[]> = {}
  for (const op of ops) {
    if (!bySign[op.sign]) bySign[op.sign] = []
    bySign[op.sign].push(op)
  }
  return Object.entries(bySign).map(([sign, signOps]) => {
    const byType: Record<string, number> = {}
    for (const op of signOps) byType[op.type.name] = (byType[op.type.name] ?? 0) + op.amount
    return {
      user,
      sign,
      label: sign === '-' ? 'Uscite' : 'Entrate',
      chartData: {
        labels: Object.keys(byType),
        datasets: [{
          data: Object.values(byType).map((v) => Math.round(v * 100) / 100),
          backgroundColor: COLORS.slice(0, Object.keys(byType).length),
        }],
      },
    }
  })
}

const byUser = computed(() => {
  const groups: Record<string, Operation[]> = {}
  for (const op of props.operations) {
    if (!groups[op.user.name]) groups[op.user.name] = []
    groups[op.user.name].push(op)
  }
  const result: Record<string, ReturnType<typeof buildCharts>> = {}
  for (const [user, ops] of Object.entries(groups)) result[user] = buildCharts(ops, user)
  result['Totale'] = buildCharts(props.operations, 'Totale')
  return result
})
</script>

<template>
  <div v-for="(charts, user) in byUser" :key="user" class="mt-3">
    <div class="card border-primary mb-3">
      <div class="card-header bg-primary text-white">
        <h3 class="card-title mb-0">{{ user }}</h3>
      </div>
      <div class="card-body">
        <div class="row">
          <div v-for="chart in charts" :key="`${user}-${chart.sign}`" class="col-md-6">
            <div class="card mb-2">
              <div class="card-header"><h5 class="mb-0">{{ chart.label }}</h5></div>
              <div class="card-body"><DoughnutChart :data="chart.chartData" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
