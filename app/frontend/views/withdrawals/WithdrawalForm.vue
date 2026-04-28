<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { withdrawalService } from '../../services/withdrawalService'
import { userService } from '../../services/userService'
import type { User } from '../../types'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const date = ref(new Date().toISOString().slice(0, 10))
const userId = ref<number | null>(null)
const amount = ref<number | null>(null)
const note = ref('')
const complete = ref(false)
const archive = ref(false)
const users = ref<User[]>([])
const submitted = ref(false)
const errors = ref<string[]>([])

onMounted(async () => {
  users.value = await userService.getList()
  if (isEdit.value) {
    const w = await withdrawalService.get(route.params.id as string)
    date.value = `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`
    userId.value = w.user_id
    amount.value = w.amount
    note.value = w.note
    complete.value = w.complete
    archive.value = w.archive
  }
})

async function submit() {
  submitted.value = true
  errors.value = []
  if (!date.value) errors.value.push('La data è obbligatoria.')
  if (!userId.value) errors.value.push('L\'utente è obbligatorio.')
  if (errors.value.length) return

  const payload = {
    date: date.value,
    user_id: userId.value!,
    amount: amount.value ?? 0,
    note: note.value,
    complete: complete.value,
    archive: archive.value,
  }

  const saved = isEdit.value
    ? await withdrawalService.put(route.params.id as string, payload)
    : await withdrawalService.post(payload)

  router.push(`/withdrawals/${saved.id}`)
}
</script>

<template>
  <div>
    <h1>{{ isEdit ? 'Modifica prelievo' : 'Nuovo prelievo' }}</h1>
    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>
    <form novalidate @submit.prevent="submit">
      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Data</label>
        <div class="col-sm-10">
          <input v-model="date" type="date" class="form-control" required />
        </div>
      </div>
      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Utente</label>
        <div class="col-sm-10">
          <select v-model.number="userId" class="form-control" required>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
      </div>
      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Prelevati</label>
        <div class="col-sm-10">
          <input v-model.number="amount" type="number" step="0.1" class="form-control" />
        </div>
      </div>
      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Note</label>
        <div class="col-sm-10">
          <textarea v-model="note" class="form-control" maxlength="4000" />
        </div>
      </div>
      <div class="form-check mb-2">
        <input v-model="complete" type="checkbox" class="form-check-input" id="complete" />
        <label class="form-check-label" for="complete">Completato</label>
      </div>
      <div class="form-check mb-3">
        <input v-model="archive" type="checkbox" class="form-check-input" id="archive" />
        <label class="form-check-label" for="archive">Archiviato</label>
      </div>
      <button type="submit" class="btn btn-primary">Salva</button>
      <router-link v-if="isEdit" :to="`/withdrawals/${route.params.id}`" class="btn btn-secondary ms-2">
        Annulla
      </router-link>
    </form>
  </div>
</template>
