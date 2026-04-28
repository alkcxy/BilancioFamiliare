<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { typeService } from '../../services/typeService'
import type { Type } from '../../types'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const type = ref<Partial<Type>>({})
const allTypes = ref<Type[]>([])
const spendingLimitJson = ref('')
const submitted = ref(false)
const errors = ref<string[]>([])

onMounted(async () => {
  allTypes.value = await typeService.getList()
  if (isEdit.value) {
    const data = await typeService.get(route.params.id as string)
    type.value = { ...data }
    spendingLimitJson.value = data.spending_limit ? JSON.stringify(data.spending_limit, null, 2) : ''
  }
})

async function submit() {
  submitted.value = true
  errors.value = []

  if (!type.value.name?.trim()) {
    errors.value.push('Il nome è obbligatorio.')
    return
  }

  if (spendingLimitJson.value.trim()) {
    try {
      type.value.spending_limit = JSON.parse(spendingLimitJson.value)
    } catch {
      errors.value.push('spending_limit non è un JSON valido.')
      return
    }
  } else {
    type.value.spending_limit = undefined
  }

  const payload = {
    name: type.value.name,
    description: type.value.description,
    master_type_id: type.value.master_type_id,
    spending_roof: type.value.spending_roof,
    spending_limit: type.value.spending_limit,
  }

  const saved = isEdit.value
    ? await typeService.put(route.params.id as string, payload)
    : await typeService.post(payload)

  router.push(`/types/${saved.id}`)
}
</script>

<template>
  <div>
    <h1>{{ isEdit ? 'Modifica categoria' : 'Nuova categoria' }}</h1>
    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>
    <form novalidate @submit.prevent="submit">
      <div class="row mb-3">
        <label for="type-name" class="col-sm-2 col-form-label">Nome</label>
        <div class="col-sm-10">
          <input id="type-name" v-model="type.name" type="text" class="form-control" required />
          <div v-if="submitted && !type.name?.trim()" class="alert alert-danger mt-1 mb-0 py-1">
            Il campo è obbligatorio.
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label for="type-description" class="col-sm-2 col-form-label">Descrizione</label>
        <div class="col-sm-10">
          <textarea id="type-description" v-model="type.description" class="form-control" />
        </div>
      </div>

      <div class="row mb-3">
        <label for="type-master" class="col-sm-2 col-form-label">Tipo padre</label>
        <div class="col-sm-10">
          <input
            id="type-master"
            v-model.number="type.master_type_id"
            type="number" step="1" min="1"
            class="form-control" list="master_list"
          />
          <datalist id="master_list">
            <option v-for="t in allTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </datalist>
        </div>
      </div>

      <div class="row mb-3">
        <label for="type-roof" class="col-sm-2 col-form-label">Tetto di Spesa Mensile</label>
        <div class="col-sm-10">
          <input id="type-roof" v-model.number="type.spending_roof" type="number" step="0.1" class="form-control" />
        </div>
      </div>

      <div class="row mb-3">
        <label for="type-limit" class="col-sm-2 col-form-label">Spending limit (JSON)</label>
        <div class="col-sm-10">
          <textarea id="type-limit" v-model="spendingLimitJson" class="form-control" rows="4" />
        </div>
      </div>

      <div class="row mb-3">
        <div class="offset-sm-2 col-sm-10">
          <button type="submit" class="btn btn-primary">Salva</button>
          <router-link v-if="isEdit" :to="`/types/${route.params.id}`" class="btn btn-secondary ms-2">
            Annulla
          </router-link>
        </div>
      </div>
    </form>
  </div>
</template>
