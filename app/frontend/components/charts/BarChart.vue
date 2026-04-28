<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

defineProps<{
  data: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor?: string | string[] }[] }
}>()
</script>

<template>
  <Bar :data="data" :options="{ responsive: true, plugins: { legend: { display: true } } }" />
</template>
