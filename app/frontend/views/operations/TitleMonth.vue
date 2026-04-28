<script setup lang="ts">
import { computed } from 'vue'
import { MONTHS } from '../../utils/months'

const props = defineProps<{ year: number; month: number }>()
const monthName = computed(() => MONTHS.find((m) => m._id === props.month)?.name ?? '')
</script>

<template>
  <h1>
    Movimenti di {{ monthName }} {{ year }}
    <br />
    <small class="text-muted">
      <router-link :to="`/operations/year/${year}`">Torna al {{ year }}</router-link>
    </small>
  </h1>
</template>
