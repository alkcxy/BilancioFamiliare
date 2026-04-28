<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps<{
  data: { labels: string[]; datasets: { data: number[]; backgroundColor?: string[] }[] }
}>()
</script>

<template>
  <Doughnut :data="data" :options="{ responsive: true, plugins: { legend: { display: true } } }" />
</template>
