<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { operationService } from '../services/operationService'

const emit = defineEmits<{ changed: [years: number[]] }>()

const activeYears = ref<number[]>([])
const selected = ref<Record<number, boolean>>({})

onMounted(async () => {
  const max = await operationService.getMax()
  activeYears.value = max.map((e) => e.year).sort((a, b) => b - a)
})

function onChange() {
  emit('changed', activeYears.value.filter((y) => selected.value[y]))
}
</script>

<template>
  <div class="jumbotron p-3 mb-3">
    <h4>Filtri Anno</h4>
    <div v-for="year in activeYears" :key="year" class="form-check form-check-inline">
      <input
        :id="`y${year}`"
        v-model="selected[year]"
        type="checkbox"
        class="form-check-input"
        @change="onChange"
      />
      <label :for="`y${year}`" class="form-check-label">{{ year }}</label>
    </div>
  </div>
</template>
