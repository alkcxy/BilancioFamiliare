<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userService } from '../../services/userService'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const blocked = ref(false)
const submitted = ref(false)
const errors = ref<string[]>([])

onMounted(async () => {
  if (isEdit.value) {
    const u = await userService.get(route.params.id as string)
    name.value = u.name
    email.value = u.email
    blocked.value = u.blocked
  }
})

async function submit() {
  submitted.value = true
  errors.value = []
  if (!name.value.trim()) errors.value.push('Il nome è obbligatorio.')
  if (!email.value.trim()) errors.value.push('L\'email è obbligatoria.')
  if (!isEdit.value || password.value) {
    if (password.value.length < 8) errors.value.push('La password deve avere almeno 8 caratteri.')
    if (password.value !== passwordConfirmation.value) errors.value.push('Le password non coincidono.')
  }
  if (errors.value.length) return

  const payload: Record<string, unknown> = { name: name.value, email: email.value, blocked: blocked.value }
  if (password.value) {
    payload.password = password.value
    payload.password_confirmation = passwordConfirmation.value
  }

  const saved = isEdit.value
    ? await userService.put(route.params.id as string, payload)
    : await userService.post(payload)

  router.push(`/users/${saved.id}`)
}
</script>

<template>
  <div>
    <h1>{{ isEdit ? 'Modifica utente' : 'Nuovo utente' }}</h1>
    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>
    <form class="form-horizontal" novalidate @submit.prevent="submit">
      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Nome</label>
        <div class="col-sm-10">
          <input v-model="name" type="text" class="form-control" required />
        </div>
      </div>
      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Email</label>
        <div class="col-sm-10">
          <input v-model="email" type="email" class="form-control" required />
        </div>
      </div>
      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Password</label>
        <div class="col-sm-10">
          <input v-model="password" type="password" class="form-control" :required="!isEdit" minlength="8" />
        </div>
      </div>
      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Conferma Password</label>
        <div class="col-sm-10">
          <input v-model="passwordConfirmation" type="password" class="form-control" :required="!isEdit" minlength="8" />
          <div v-if="submitted && password !== passwordConfirmation" class="alert alert-danger mt-1 py-1 mb-0">
            Le password non coincidono.
          </div>
        </div>
      </div>
      <div class="form-check mb-3">
        <input v-model="blocked" type="checkbox" class="form-check-input" id="blocked" />
        <label class="form-check-label" for="blocked">Bloccato</label>
      </div>
      <button type="submit" class="btn btn-primary">Salva</button>
      <router-link v-if="isEdit" :to="`/users/${route.params.id}`" class="btn btn-secondary ms-2">
        Annulla
      </router-link>
    </form>
  </div>
</template>
