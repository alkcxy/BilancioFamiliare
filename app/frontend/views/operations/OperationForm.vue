<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { operationService } from '../../services/operationService'
import { userService } from '../../services/userService'
import { typeService } from '../../services/typeService'
import { api } from '../../lib/api'
import { currency } from '../../utils/format'
import FormRepeater from './FormRepeater.vue'
import { useAuthStore } from '../../stores/auth'
import type { Type, User } from '../../types'

type DuplicateMatch = {
  id: number; amount: number; date: string; note: string
  kind: 'probable' | 'possible' | 'contextual'
  sign?: string; type_name?: string | null; user_name?: string | null
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isEdit = computed(() => !!route.params.id)

// form fields
const date = ref(new Date().toISOString().slice(0, 10))
const typeId = ref<number | null>(null)
const typeQuery = ref('')
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
const dayOfMonthRepeat = ref('1')

// support data
const types = ref<Type[]>([])
const users = ref<User[]>([])
const submitted = ref(false)
const errors = ref<string[]>([])

// spending limit feedback
const totalAmount = ref<number | null>(null)
const avgAmount = ref<number | null>(null)

// type dropdown
const showTypeSuggestions = ref(false)

const filteredTypes = computed(() => {
  const q = typeQuery.value.trim().toLowerCase()
  if (!q) return types.value
  const isExact = types.value.some((t) => typeOptionLabel(t).toLowerCase() === q)
  if (isExact) return types.value
  return types.value.filter((t) => typeOptionLabel(t).toLowerCase().includes(q))
})

function selectType(t: Type) {
  typeId.value = t.id
  typeQuery.value = typeOptionLabel(t)
  showTypeSuggestions.value = false
}

// duplicate detection
const duplicates = ref<DuplicateMatch[]>([])
const checkingDuplicates = ref(false)
const contextualMatches = ref<DuplicateMatch[]>([])

function typeOptionLabel(t: Type): string {
  return t.master_type ? `${t.master_type.name} > ${t.name}` : t.name
}

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

watch(amount, (val) => {
  if (val !== null && val < 0) {
    sign.value = '-'
    amount.value = Math.abs(val)
  }
})

watch(typeQuery, (q) => {
  const match = types.value.find((t) => typeOptionLabel(t) === q)
  typeId.value = match?.id ?? null
  if (match) showTypeSuggestions.value = false
})

watch(typeId, (id) => {
  const t = id !== null ? types.value.find((t) => t.id === id) : null
  const label = t ? typeOptionLabel(t) : ''
  if (label !== typeQuery.value) typeQuery.value = label
})

let duplicateTimer: ReturnType<typeof setTimeout> | null = null

watch([date, amount, typeId, note], () => {
  if (isEdit.value) return
  if (duplicateTimer !== null) clearTimeout(duplicateTimer)
  duplicates.value = []
  contextualMatches.value = []
  if (!date.value || (amount.value === null && !typeId.value)) return
  duplicateTimer = setTimeout(checkDuplicates, 600)
})

async function checkDuplicates() {
  checkingDuplicates.value = true
  duplicates.value = []
  contextualMatches.value = []
  try {
    const rows = [{ date: date.value, amount: amount.value, type_id: typeId.value, note: note.value }]
    const results = await api.post<{ index: number; matches: DuplicateMatch[] }[]>(
      '/operations/check_duplicates.json', { rows },
    )
    duplicates.value = results[0]?.matches ?? []

    const excludeIds = duplicates.value.map((d) => d.id)
    const contextual = await api.post<DuplicateMatch[]>('/operations/check_contextual.json', {
      row: { date: date.value, amount: amount.value, note: note.value, type_id: typeId.value },
      exclude_ids: excludeIds,
    })
    contextualMatches.value = contextual
  } finally {
    checkingDuplicates.value = false
  }
}

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
    const q = route.query
    if (q.type_id) typeId.value = Number(q.type_id)
    userId.value = q.user_id ? Number(q.user_id) : (auth.currentUser?.id ?? null)
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
    if (dayOfMonthRepeat.value !== '') {
      payload.day_of_month_repeat = dayOfMonthRepeat.value
    }
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
    <form novalidate @submit.prevent="submit">

      <div class="row mb-3">
        <label for="op-date" class="col-sm-2 col-form-label">Data</label>
        <div class="col-sm-10">
          <input id="op-date" v-model="date" type="date" class="form-control" required />
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
        :day-of-month-repeat="dayOfMonthRepeat"
        @update:repeat="repeat = $event"
        @update:interval-repeat="intervalRepeat = $event"
        @update:type-repeat="typeRepeat = $event"
        @update:week-repeat="weekRepeat = $event"
        @update:wday-repeat="wdayRepeat = $event"
        @update:last-date-repeat="lastDateRepeat = $event"
        @update:day-of-month-repeat="dayOfMonthRepeat = $event"
      />

      <div class="row mb-3">
        <label for="op-type" class="col-sm-2 col-form-label">Tipo</label>
        <div class="col-sm-10">
          <div class="position-relative">
            <input id="op-type" v-model="typeQuery" type="text" class="form-control"
                   autocomplete="off" required
                   @focus="showTypeSuggestions = true"
                   @blur="showTypeSuggestions = false" />
            <ul v-if="showTypeSuggestions && filteredTypes.length"
                class="list-group position-absolute w-100 shadow-sm mb-0"
                style="z-index:1050; max-height:200px; overflow-y:auto; top:100%;">
              <li v-for="t in filteredTypes" :key="t.id"
                  class="list-group-item list-group-item-action py-1 small"
                  @mousedown.prevent="selectType(t)">
                {{ typeOptionLabel(t) }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <label for="op-user" class="col-sm-2 col-form-label">Utente</label>
        <div class="col-sm-10">
          <select id="op-user" v-model.number="userId" class="form-control" required>
            <option :value="null" disabled>Seleziona</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
      </div>

      <div class="row mb-3">
        <label for="op-sign" class="col-sm-2 col-form-label">Segno</label>
        <div class="col-sm-10">
          <select id="op-sign" v-model="sign" class="form-control" required>
            <option value="">Seleziona</option>
            <option value="+">Entrata</option>
            <option value="-">Uscita</option>
          </select>
        </div>
      </div>

      <div class="row mb-3">
        <label for="op-amount" class="col-sm-2 col-form-label">Importo</label>
        <div class="col-sm-10">
          <input id="op-amount" v-model.number="amount" type="number" step="0.01" class="form-control mb-2" required />

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

      <div class="row mb-3">
        <label for="op-note" class="col-sm-2 col-form-label">Note</label>
        <div class="col-sm-10">
          <textarea id="op-note" v-model="note" class="form-control" maxlength="4000" />
        </div>
      </div>

      <!-- Duplicate detection (create mode only) -->
      <div v-if="!isEdit && (checkingDuplicates || duplicates.length > 0 || contextualMatches.length > 0)" class="row mb-3">
        <div class="col-sm-10 offset-sm-2">
          <div v-if="checkingDuplicates" class="text-muted small">
            <span class="spinner-border spinner-border-sm me-1"></span>
            Controllo duplicati…
          </div>
          <template v-else>
            <div v-if="duplicates.some(d => d.kind === 'probable')" class="alert alert-warning py-2 mb-2">
              <strong>Probabile duplicato</strong> — potrebbe essere già presente
            </div>
            <div v-else-if="duplicates.length" class="alert alert-info py-2 mb-2">
              <strong>Da verificare</strong> — trovati record simili
            </div>

            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light">
                <tr>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Importo</th>
                  <th>Nota</th>
                  <th>Categoria</th>
                  <th>Utente</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in duplicates" :key="m.id"
                    :class="{ 'table-warning': m.kind === 'probable', 'table-info': m.kind === 'possible' }">
                  <td>
                    <span v-if="m.kind === 'probable'" class="badge bg-warning text-dark">Probabile</span>
                    <span v-else class="badge bg-info text-dark">Possibile</span>
                  </td>
                  <td>{{ m.date }}</td>
                  <td>{{ currency(m.amount) }}</td>
                  <td>{{ m.note }}</td>
                  <td>{{ m.type_name }}</td>
                  <td>{{ m.user_name }}</td>
                  <td><a :href="`/operations/${m.id}`" target="_blank" class="btn btn-sm btn-outline-secondary py-0">Apri</a></td>
                </tr>
                <tr v-for="m in contextualMatches" :key="'ctx-' + m.id">
                  <td><span class="badge bg-secondary">Stesso mese</span></td>
                  <td>{{ m.date }}</td>
                  <td>{{ currency(m.amount) }}</td>
                  <td>{{ m.note }}</td>
                  <td>{{ m.type_name }}</td>
                  <td>{{ m.user_name }}</td>
                  <td><a :href="`/operations/${m.id}`" target="_blank" class="btn btn-sm btn-outline-secondary py-0">Apri</a></td>
                </tr>
              </tbody>
            </table>
          </template>
        </div>
      </div>

      <div class="row mb-3">
        <router-link v-if="isEdit" :to="`/operations/${route.params.id}`" class="btn btn-dark me-2">
          Indietro
        </router-link>
        <button type="submit" class="btn btn-primary">Salva</button>
      </div>
    </form>
  </div>
</template>
