<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

defineProps<{
  data: { labels: string[]; datasets: { label: string; data: number[]; borderColor?: string; backgroundColor?: string }[] }
}>()
</script>

<template>
  <Line :data="data" :options="{ responsive: true, plugins: { legend: { display: true } } }" />
</template>
