<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { typeService } from '../services/typeService'
import type { Type } from '../types'

const emit = defineEmits<{ changed: [types: Type[]] }>()

const types = ref<Type[]>([])
const selected = ref<Record<number, boolean>>({})

onMounted(async () => {
  types.value = await typeService.getList()
})

function onChange() {
  emit('changed', types.value.filter((t) => selected.value[t.id]))
}
</script>

<template>
  <div class="jumbotron p-3 mb-3">
    <h4>Filtri Categorie</h4>
    <div v-for="t in types" :key="t.id" class="form-check form-check-inline">
      <input
        :id="`t${t.id}`"
        v-model="selected[t.id]"
        type="checkbox"
        class="form-check-input"
        @change="onChange"
      />
      <label :for="`t${t.id}`" class="form-check-label">{{ t.name }}</label>
    </div>
  </div>
</template>
