<script setup lang="ts">
import { computed } from 'vue'
import { MONTHS } from '../../utils/months'

const props = defineProps<{ year: number; month: number }>()

const prev = computed(() =>
  props.month > 1 ? { year: props.year, month: props.month - 1 } : { year: props.year - 1, month: 12 },
)
const next = computed(() =>
  props.month < 12 ? { year: props.year, month: props.month + 1 } : { year: props.year + 1, month: 1 },
)

const prevLabel = computed(() => MONTHS.find((m) => m._id === prev.value.month)?.name ?? '')
const nextLabel = computed(() => MONTHS.find((m) => m._id === next.value.month)?.name ?? '')

function pad(m: number) { return String(m).padStart(2, '0') }
</script>

<template>
  <nav class="mt-3">
    <ul class="pagination justify-content-center">
      <li class="page-item">
        <router-link :to="`/operations/${prev.year}/${pad(prev.month)}`" class="page-link">
          &laquo; {{ prevLabel }}
        </router-link>
      </li>
      <li class="page-item">
        <router-link :to="`/operations/${next.year}/${pad(next.month)}`" class="page-link">
          {{ nextLabel }} &raquo;
        </router-link>
      </li>
    </ul>
  </nav>
</template>
