<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { operationService } from '../../services/operationService'
import { userService } from '../../services/userService'
import { typeService } from '../../services/typeService'
import { currency } from '../../utils/format'
import FormRepeater from './FormRepeater.vue'
import type { Type, User } from '../../types'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

// form fields
const date = ref(new Date().toISOString().slice(0, 10))
const typeId = ref<number | null>(null)
const userId = ref<number | null>(null)
const sign = ref<'+' | '-' | ''>('')
const amount = ref<number | null>(null)
const note = ref('')

// repeater fields (only on create)
const repeat = ref(0)
const intervalRepeat = ref<number | null>(null)
const typeRepeat = ref('')
const weekRepeat = ref('')
const wdayRepeat = ref('')
const lastDateRepeat = ref('')

// support data
const types = ref<Type[]>([])
const users = ref<User[]>([])
const submitted = ref(false)
const errors = ref<string[]>([])

// spending limit feedback
const totalAmount = ref<number | null>(null)
const avgAmount = ref<number | null>(null)

const selectedType = computed<Type | null>(
  () => types.value.find((t) => t.id === typeId.value) ?? null,
)

const spendingAlert = computed(() => {
  if (!selectedType.value || sign.value !== '-' || totalAmount.value == null) return null
  return operationService.spending_limit_cap(
    { sign: sign.value, date: date.value },
    selectedType.value,
    totalAmount.value,
  )
})

const applicableLimit = computed(() => {
  if (!selectedType.value?.spending_limit || !date.value) return null
  return operationService.spending_limit_amount(selectedType.value.spending_limit, date.value)
})

async function checkTotalAmount() {
  if (!typeId.value || !date.value || sign.value !== '-') return
  const d = new Date(date.value)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const currentId = isEdit.value ? Number(route.params.id) : null

  const monthOps = await operationService.month(year, month)
  const base = amount.value ?? 0
  totalAmount.value = monthOps.reduce((acc, o) => {
    if (o.sign === '-' && o.type_id === typeId.value && o.id !== currentId) return acc + o.amount
    return acc
  }, base)

  const yearOps = await operationService.year(year)
  const sameType = yearOps.filter((o) => o.sign === '-' && o.type_id === typeId.value)
  const maxMonth = sameType.reduce((m, o) => Math.max(m, o.month), month)
  const base2 = amount.value ?? 0
  const total = sameType.reduce((acc, o) => acc + o.amount, base2)
  avgAmount.value = total / maxMonth
}

watch([typeId, date, amount, sign], () => {
  if (sign.value === '-') checkTotalAmount()
  else totalAmount.value = null
})

onMounted(async () => {
  const [ts, us] = await Promise.all([typeService.getList(), userService.getList()])
  types.value = ts
  users.value = us

  if (isEdit.value) {
    const op = await operationService.get(route.params.id as string)
    date.value = `${op.year}-${String(op.month).padStart(2, '0')}-${String(op.day).padStart(2, '0')}`
    typeId.value = op.type_id
    userId.value = op.user_id
    sign.value = op.sign
    amount.value = op.amount
    note.value = op.note
  } else {
    // pre-fill from query params (used when cloning from OperationShow)
    const q = route.query
    if (q.type_id) typeId.value = Number(q.type_id)
    if (q.user_id) userId.value = Number(q.user_id)
    if (q.sign) sign.value = q.sign as '+' | '-'
  }
})

async function submit() {
  submitted.value = true
  errors.value = []
  if (!date.value) errors.value.push('La data è obbligatoria.')
  if (!typeId.value) errors.value.push('Il tipo è obbligatorio.')
  if (!userId.value) errors.value.push('L\'utente è obbligatorio.')
  if (!sign.value) errors.value.push('Il segno è obbligatorio.')
  if (amount.value == null) errors.value.push('L\'importo è obbligatorio.')
  if (errors.value.length) return

  const payload: Parameters<typeof operationService.post>[0] = {
    date: date.value,
    type_id: typeId.value!,
    user_id: userId.value!,
    sign: sign.value as '+' | '-',
    amount: amount.value!,
    note: note.value,
  }

  if (!isEdit.value && repeat.value === 1) {
    payload.repeat = 1
    payload.interval_repeat = intervalRepeat.value ?? undefined
    payload.type_repeat = typeRepeat.value
    payload.wday_repeat = wdayRepeat.value
    payload.week_repeat = weekRepeat.value
    payload.last_date_repeat = lastDateRepeat.value
  }

  const saved = isEdit.value
    ? await operationService.put(route.params.id as string, payload)
    : await operationService.post(payload)

  router.push(`/operations/${saved.id}`)
}
</script>

<template>
  <div>
    <h1>{{ isEdit ? 'Modifica operazione' : 'Nuova operazione' }}</h1>
    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>
    <form class="form-horizontal" novalidate @submit.prevent="submit">

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Data</label>
        <div class="col-sm-10">
          <input v-model="date" type="date" class="form-control" required />
        </div>
      </div>

      <!-- FormRepeater shown only on create -->
      <FormRepeater
        v-if="!isEdit"
        :date="date"
        :repeat="repeat"
        :interval-repeat="intervalRepeat"
        :type-repeat="typeRepeat"
        :week-repeat="weekRepeat"
        :wday-repeat="wdayRepeat"
        :last-date-repeat="lastDateRepeat"
        @update:repeat="repeat = $event"
        @update:interval-repeat="intervalRepeat = $event"
        @update:type-repeat="typeRepeat = $event"
        @update:week-repeat="weekRepeat = $event"
        @update:wday-repeat="wdayRepeat = $event"
        @update:last-date-repeat="lastDateRepeat = $event"
      />

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Tipo</label>
        <div class="col-sm-10">
          <select v-model.number="typeId" class="form-control" required>
            <option :value="null" disabled>Seleziona</option>
            <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Utente</label>
        <div class="col-sm-10">
          <select v-model.number="userId" class="form-control" required>
            <option :value="null" disabled>Seleziona</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Segno</label>
        <div class="col-sm-10">
          <select v-model="sign" class="form-control" required>
            <option value="">Seleziona</option>
            <option value="+">Entrata</option>
            <option value="-">Uscita</option>
          </select>
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Importo</label>
        <div class="col-sm-10">
          <input v-model.number="amount" type="number" step="0.01" min="0" class="form-control mb-2" required />

          <!-- Spending limit feedback -->
          <template v-if="sign === '-' && selectedType?.spending_roof">
            <div v-if="!selectedType.spending_limit" class="alert alert-light">
              Tetto di spesa per {{ selectedType.name }}: {{ currency(selectedType.spending_roof) }}
            </div>
            <div v-else-if="applicableLimit" class="alert alert-light">
              Tetto di spesa per {{ selectedType.name }}: {{ currency(applicableLimit.amount) }}
            </div>
            <div v-if="spendingAlert === 1" class="alert alert-danger">
              È stato superato il tetto di spesa mensile per questa categoria.
              <br />Totale del mese: {{ currency(totalAmount) }}
            </div>
            <div v-else-if="spendingAlert === 0" class="alert alert-warning">
              È stato superato il tetto di spesa mensile per questa categoria.
              <br />Totale del mese: {{ currency(totalAmount) }}
            </div>
            <div v-else-if="spendingAlert === null && totalAmount !== null" class="alert alert-info">
              Non è stato superato il tetto di spesa media mensile per questa categoria.
              <br />Media mensile: {{ currency(avgAmount) }}
            </div>
          </template>
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="col-sm-2 control-label">Note</label>
        <div class="col-sm-10">
          <textarea v-model="note" class="form-control" maxlength="4000" />
        </div>
      </div>

      <div class="form-group mb-3">
        <router-link v-if="isEdit" :to="`/operations/${route.params.id}`" class="btn btn-dark me-2">
          Indietro
        </router-link>
        <button type="submit" class="btn btn-primary">Salva</button>
      </div>
    </form>
  </div>
</template>
