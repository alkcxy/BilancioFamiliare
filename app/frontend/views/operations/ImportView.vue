<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { parseCsv, inferSign } from '../../lib/csvParser'
import { operationService } from '../../services/operationService'
import { withdrawalService } from '../../services/withdrawalService'
import { typeService } from '../../services/typeService'
import { userService } from '../../services/userService'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/auth'
import type { Type, User } from '../../types'

const router = useRouter()
const auth = useAuthStore()

const types = ref<Type[]>([])
const users = ref<User[]>([])

onMounted(async () => {
  ;[types.value, users.value] = await Promise.all([typeService.getList(), userService.getList()])
  globalUserId.value = auth.currentUser?.id ?? null
})

// ── CSV column mapper state ─────────────────────────────────────────────────
const headers = ref<string[]>([])
const csvRows = ref<string[][]>([])
const dateCol = ref(0)
const noteCol = ref(1)
const amountCol = ref(2)
const showColMapper = ref(false)

// ── Editable row state ──────────────────────────────────────────────────────
type DuplicateMatch = { id: number; amount: number; date: string; note: string; kind: 'probable' | 'possible' }
type SavedOperation = { id: number; date: string; note: string; amount: number; sign: string; type: { name: string }; user: { name: string }; action: 'created' | 'updated' }
type SavedWithdrawal = { id: number; date: string; note: string; amount: number; action: 'created' | 'updated' }
type Row = {
  date: string
  note: string
  sign: '+' | '-'
  amount: string
  typeId: number | null
  userId: number | null
  selected: boolean
  duplicate: DuplicateMatch | null
  updateExisting: boolean
}

type WithdrawalRow = {
  date: string
  amount: string
  note: string
  userId: number | null
  selected: boolean
  complete: boolean
  archive: boolean
  duplicate: DuplicateMatch | null
  updateExisting: boolean
}

const rows = ref<Row[]>([])
const withdrawalRows = ref<WithdrawalRow[]>([])
const skippedCount = ref(0)
const savedResult = ref<{ operations: SavedOperation[]; withdrawals: SavedWithdrawal[] } | null>(null)

// Global fill-all defaults
const globalTypeId = ref<number | null>(null)
const globalUserId = ref<number | null>(null)
const sourceAccount = ref('')

function applyGlobalType() {
  if (globalTypeId.value) rows.value.forEach(r => { if (!r.typeId) r.typeId = globalTypeId.value })
  checkDuplicates()
}
function applyGlobalUser() {
  if (globalUserId.value) {
    rows.value.forEach(r => { r.userId = globalUserId.value })
    withdrawalRows.value.forEach(r => { r.userId = globalUserId.value })
  }
}

function matchTypeId(name?: string | null): number | null {
  if (!name) return null
  const lower = name.toLowerCase()
  return types.value.find(t => t.name.toLowerCase() === lower)?.id ?? null
}

function autoDeselectInternal() {
  rows.value.forEach(r => {
    if (/^(da |a )/i.test(r.note.trim())) r.selected = false
  })
}

// ── File handling ───────────────────────────────────────────────────────────
const extracting = ref(false)
const errors = ref<string[]>([])
const submitting = ref(false)

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  errors.value = []
  rows.value = []
  withdrawalRows.value = []
  skippedCount.value = 0
  showColMapper.value = false

  if (IMAGE_TYPES.includes(file.type) || file.type === 'application/pdf') {
    await extractWithAI(file)
  } else {
    loadCsv(file)
  }
}

async function extractWithAI(file: File) {
  extracting.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const resp = await fetch('/operations/extract.json', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      body: form,
    })
    if (!resp.ok) {
      const err = await resp.json()
      errors.value.push(err.error ?? 'Estrazione fallita.')
      return
    }
    const extracted: {
      date: string
      note: string
      sign: '+' | '-'
      amount: string
      kind?: 'operation' | 'withdrawal' | 'skip'
      type_name?: string | null
    }[] = await resp.json()

    skippedCount.value = extracted.filter(r => r.kind === 'skip').length

    withdrawalRows.value = extracted
      .filter(r => r.kind === 'withdrawal')
      .map(r => ({
        date: r.date,
        amount: r.amount,
        note: r.note,
        userId: globalUserId.value,
        selected: true,
        complete: false,
        archive: false,
        duplicate: null,
        updateExisting: false,
      }))

    rows.value = extracted
      .filter(r => !r.kind || r.kind === 'operation')
      .map(r => ({
        date: r.date,
        note: r.note,
        sign: r.sign,
        amount: r.amount,
        typeId: matchTypeId(r.type_name),
        userId: globalUserId.value,
        selected: true,
        duplicate: null,
        updateExisting: false,
      }))
    autoDeselectInternal()
    await Promise.all([checkDuplicates(), checkWithdrawalDuplicates()])
  } catch {
    errors.value.push("Errore di rete durante l'estrazione.")
  } finally {
    extracting.value = false
  }
}

function loadCsv(file: File) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result as string
    const parsed = parseCsv(text)
    headers.value = parsed.headers
    csvRows.value = parsed.rows
    headers.value.forEach((h, i) => {
      const l = h.toLowerCase()
      if (/dat/.test(l)) dateCol.value = i
      else if (/not|desc/.test(l)) noteCol.value = i
      else if (/imp|amou|val/.test(l)) amountCol.value = i
    })
    showColMapper.value = true
    buildRowsFromCsv()
  }
  reader.readAsText(file)
}

function buildRowsFromCsv() {
  rows.value = csvRows.value.map(r => {
    const raw = r[amountCol.value] ?? ''
    const { sign, amount } = inferSign(raw)
    return {
      date: r[dateCol.value] ?? '',
      note: r[noteCol.value] ?? '',
      sign,
      amount,
      typeId: globalTypeId.value,
      userId: globalUserId.value,
      selected: true,
      duplicate: null,
      updateExisting: false,
    }
  })
  autoDeselectInternal()
  checkDuplicates()
}

watch([dateCol, noteCol, amountCol], buildRowsFromCsv)

// ── Duplicate detection ─────────────────────────────────────────────────────
async function checkDuplicates() {
  const rowsWithType = rows.value
    .map((r, i) => ({ i, row: r }))
    .filter(({ row }) => row.date && row.amount && !row.updateExisting)

  if (!rowsWithType.length) return

  try {
    const payload = rowsWithType.map(({ row }) => ({
      date: row.date,
      amount: parseFloat(row.amount),
      type_id: row.typeId,
      note: row.note,
    }))
    const matches: { index: number; match: DuplicateMatch }[] = await api.post(
      '/operations/check_duplicates.json',
      { rows: payload },
    )

    rows.value.forEach(r => {
      if (r.duplicate !== null && !r.updateExisting) {
        if (r.duplicate.kind === 'probable') r.selected = true
        r.duplicate = null
      }
    })

    matches.forEach(({ index, match }) => {
      const realIndex = rowsWithType[index]?.i
      if (realIndex !== undefined) {
        rows.value[realIndex].duplicate = match
        if (match.kind === 'probable') rows.value[realIndex].selected = false
      }
    })
  } catch {
    // silently ignore duplicate check errors
  }
}

async function checkWithdrawalDuplicates() {
  const eligible = withdrawalRows.value
    .map((r, i) => ({ i, row: r }))
    .filter(({ row }) => row.date && row.amount && !row.updateExisting)

  if (!eligible.length) return

  try {
    const payload = eligible.map(({ row }) => ({
      date: row.date,
      amount: parseFloat(row.amount),
      note: row.note,
    }))
    const matches: { index: number; match: DuplicateMatch }[] = await api.post(
      '/withdrawals/check_duplicates.json',
      { rows: payload },
    )

    withdrawalRows.value.forEach(r => {
      if (r.duplicate !== null && !r.updateExisting) {
        if (r.duplicate.kind === 'probable') r.selected = true
        r.duplicate = null
      }
    })

    matches.forEach(({ index, match }) => {
      const realIndex = eligible[index]?.i
      if (realIndex !== undefined) {
        withdrawalRows.value[realIndex].duplicate = match
        if (match.kind === 'probable') withdrawalRows.value[realIndex].selected = false
      }
    })
  } catch {
    // silently ignore
  }
}

function onOpUpdateExistingChange(row: Row) {
  if (row.updateExisting) {
    row.selected = true
  } else {
    row.duplicate = null
    checkDuplicates()
  }
}

function onWdUpdateExistingChange(row: WithdrawalRow) {
  if (row.updateExisting) {
    row.selected = true
  } else {
    row.duplicate = null
    checkWithdrawalDuplicates()
  }
}

// ── Submit ──────────────────────────────────────────────────────────────────
async function submit() {
  errors.value = []
  const selectedOps = rows.value.filter(r => r.selected)
  const selectedWithdrawals = withdrawalRows.value.filter(r => r.selected)

  if (!selectedOps.length && !selectedWithdrawals.length) {
    errors.value.push('Nessuna riga selezionata.')
    return
  }
  if (selectedOps.some(r => !r.typeId)) {
    errors.value.push('Alcune operazioni selezionate non hanno una categoria.')
    return
  }
  if (selectedOps.some(r => !r.userId)) {
    errors.value.push('Alcune operazioni selezionate non hanno un utente.')
    return
  }
  if (selectedWithdrawals.some(r => !r.userId)) {
    errors.value.push('Alcuni prelievi selezionati non hanno un utente.')
    return
  }

  submitting.value = true
  try {
    const prefix = sourceAccount.value.trim() ? `${sourceAccount.value.trim()} ` : ''
    const allOps: SavedOperation[] = []
    const allWithdrawals: SavedWithdrawal[] = []

    // Operations: split create vs update
    const toCreateOps = selectedOps.filter(r => !(r.updateExisting && r.duplicate))
    const toUpdateOps = selectedOps.filter(r => r.updateExisting && r.duplicate)

    if (toCreateOps.length) {
      const ops = toCreateOps.map(r => ({
        date: r.date,
        sign: r.sign,
        amount: parseFloat(r.amount),
        type_id: r.typeId!,
        user_id: r.userId!,
        note: prefix + r.note,
      }))
      const res = await operationService.bulkCreate(ops)
      res.operations.forEach(op => allOps.push({ ...op, action: 'created' }))
    }

    if (toUpdateOps.length) {
      const results = await Promise.all(toUpdateOps.map(r =>
        operationService.put(r.duplicate!.id, {
          date: r.date,
          sign: r.sign,
          amount: parseFloat(r.amount),
          type_id: r.typeId!,
          user_id: r.userId!,
          note: prefix + r.note,
        })
      ))
      results.forEach(op => allOps.push({
        id: op.id,
        date: String(op.date ?? ''),
        note: op.note ?? '',
        amount: Number(op.amount),
        sign: op.sign,
        type: { name: (op as any).type?.name ?? '' },
        user: { name: (op as any).user?.name ?? '' },
        action: 'updated',
      }))
    }

    // Withdrawals: split create vs update
    const toCreateW = selectedWithdrawals.filter(r => !(r.updateExisting && r.duplicate))
    const toUpdateW = selectedWithdrawals.filter(r => r.updateExisting && r.duplicate)

    if (toCreateW.length) {
      const results = await Promise.all(toCreateW.map(r =>
        withdrawalService.post({
          date: r.date,
          amount: parseFloat(r.amount),
          note: prefix + r.note,
          user_id: r.userId!,
          complete: r.complete,
          archive: r.archive,
        })
      ))
      results.forEach(w => allWithdrawals.push({
        id: w.id,
        date: String(w.date ?? `${w.year}-${String(w.month).padStart(2,'0')}-${String(w.day).padStart(2,'0')}`),
        note: w.note ?? '',
        amount: Number(w.amount),
        action: 'created',
      }))
    }

    if (toUpdateW.length) {
      const results = await Promise.all(toUpdateW.map(r =>
        withdrawalService.put(r.duplicate!.id, {
          date: r.date,
          amount: parseFloat(r.amount),
          note: prefix + r.note,
          user_id: r.userId!,
          complete: r.complete,
          archive: r.archive,
        })
      ))
      results.forEach(w => allWithdrawals.push({
        id: w.id,
        date: String(w.date ?? `${w.year}-${String(w.month).padStart(2,'0')}-${String(w.day).padStart(2,'0')}`),
        note: w.note ?? '',
        amount: Number(w.amount),
        action: 'updated',
      }))
    }

    savedResult.value = { operations: allOps, withdrawals: allWithdrawals }
  } catch {
    errors.value.push("Errore durante l'importazione. Riprova.")
  } finally {
    submitting.value = false
  }
}

const selectedCount = computed(() => rows.value.filter(r => r.selected).length)
const probableCount = computed(() =>
  [...rows.value, ...withdrawalRows.value].filter(r => r.duplicate?.kind === 'probable').length)
const possibleCount = computed(() =>
  [...rows.value, ...withdrawalRows.value].filter(r => r.duplicate?.kind === 'possible').length)
const duplicateCount = computed(() => probableCount.value + possibleCount.value)
const withdrawalSelectedCount = computed(() => withdrawalRows.value.filter(r => r.selected).length)
const importLabel = computed(() => {
  const parts: string[] = []
  if (selectedCount.value) parts.push(`${selectedCount.value} operazioni`)
  if (withdrawalSelectedCount.value) parts.push(`${withdrawalSelectedCount.value} prelievi`)
  return parts.join(' e ') || '0 elementi'
})
const hasAnything = computed(() => rows.value.length > 0 || withdrawalRows.value.length > 0)

defineExpose({
  rows,
  withdrawalRows,
  autoDeselectInternal,
  checkDuplicates,
  checkWithdrawalDuplicates,
  onOpUpdateExistingChange,
  onWdUpdateExistingChange,
  submit,
})
</script>

<template>
  <div>
    <h1>Importa operazioni</h1>

    <template v-if="!savedResult">
    <div class="alert alert-info">
      <strong>Come funziona</strong>
      <ol class="mb-0 mt-1">
        <li>Carica uno <strong>screenshot, PDF</strong> o <strong>CSV</strong> dell'estratto conto.</li>
        <li>Gemini estrae le transazioni, assegna la categoria e separa i prelievi ATM.</li>
        <li>I movimenti interni al conto vengono scartati automaticamente.</li>
        <li>Controlla l'anteprima, modifica i campi necessari, seleziona le righe da salvare.</li>
        <li>Clicca <strong>Importa</strong> per salvare le righe selezionate.</li>
      </ol>
    </div>

    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>

    <div class="row mb-3">
      <label for="csv-file" class="col-sm-2 col-form-label">File</label>
      <div class="col-sm-10">
        <input id="csv-file" type="file" accept=".csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.pdf"
          class="form-control" :disabled="extracting" @change="onFile" />
        <small class="text-muted">Immagine (PNG/JPG/WebP), PDF o CSV.</small>
      </div>
    </div>

    <div v-if="extracting" class="text-muted mb-3">
      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      Estrazione in corso…
    </div>

    <div v-if="skippedCount > 0 && !extracting" class="alert alert-secondary py-2 mb-3">
      <small>{{ skippedCount }} movimento{{ skippedCount > 1 ? 'i interni' : ' interno' }} al conto scartato{{ skippedCount > 1 ? 'i' : '' }} automaticamente.</small>
    </div>

    <!-- CSV column mapper -->
    <template v-if="showColMapper && headers.length">
      <h5 class="mt-3">Mappa colonne CSV</h5>
      <div class="row mb-2">
        <label for="col-date" class="col-sm-2 col-form-label">Data</label>
        <div class="col-sm-4">
          <select id="col-date" v-model.number="dateCol" class="form-control">
            <option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option>
          </select>
        </div>
      </div>
      <div class="row mb-2">
        <label for="col-note" class="col-sm-2 col-form-label">Nota</label>
        <div class="col-sm-4">
          <select id="col-note" v-model.number="noteCol" class="form-control">
            <option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option>
          </select>
        </div>
      </div>
      <div class="row mb-3">
        <label for="col-amount" class="col-sm-2 col-form-label">Importo</label>
        <div class="col-sm-4">
          <select id="col-amount" v-model.number="amountCol" class="form-control">
            <option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option>
          </select>
        </div>
      </div>
    </template>

    <template v-if="hasAnything">
      <!-- Global fill-all -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-auto"><small class="text-muted fw-semibold">Applica a tutte:</small></div>
            <div class="col-sm-2">
              <input v-model="sourceAccount" type="text" class="form-control form-control-sm"
                placeholder="Conto (es. BancaSella)" />
            </div>
            <div class="col-sm-3">
              <select v-model.number="globalTypeId" class="form-control form-control-sm" @change="applyGlobalType">
                <option :value="null">— categoria —</option>
                <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="col-sm-3">
              <select v-model.number="globalUserId" class="form-control form-control-sm" @change="applyGlobalUser">
                <option :value="null">— utente —</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div class="col-auto ms-auto">
              <span class="badge bg-primary me-1">{{ selectedCount }} selezionate</span>
              <span v-if="probableCount" class="badge bg-warning text-dark me-1">{{ probableCount }} probabili duplicati</span>
              <span v-if="possibleCount" class="badge bg-info text-dark me-1">{{ possibleCount }} da verificare</span>
              <span v-if="withdrawalSelectedCount" class="badge bg-info text-dark">{{ withdrawalSelectedCount }} prelievi</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Operations table -->
      <template v-if="rows.length">
        <h5>Operazioni</h5>
        <div class="table-responsive mb-3">
          <table class="table table-sm table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th style="width:2rem">
                  <input type="checkbox" class="form-check-input"
                    :checked="rows.every(r => r.selected)"
                    :indeterminate="rows.some(r => r.selected) && !rows.every(r => r.selected)"
                    @change="rows.forEach(r => r.selected = ($event.target as HTMLInputElement).checked)" />
                </th>
                <th>Data</th>
                <th>Nota</th>
                <th style="width:4rem">Segno</th>
                <th style="width:7rem">Importo</th>
                <th>Categoria</th>
                <th>Utente</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i" :class="{ 'table-warning': row.duplicate?.kind === 'probable', 'table-info': row.duplicate?.kind === 'possible', 'opacity-50': !row.selected }">
                <td class="text-center">
                  <input type="checkbox" class="form-check-input" v-model="row.selected" />
                </td>
                <td>
                  <input v-model="row.date" type="date" class="form-control form-control-sm"
                    @change="checkDuplicates" />
                </td>
                <td>
                  <input v-model="row.note" type="text" class="form-control form-control-sm" />
                </td>
                <td>
                  <select v-model="row.sign" class="form-control form-control-sm"
                    :class="row.sign === '-' ? 'text-danger' : 'text-success'">
                    <option value="-">−</option>
                    <option value="+">+</option>
                  </select>
                </td>
                <td>
                  <input v-model="row.amount" type="number" step="0.01" min="0"
                    class="form-control form-control-sm" @change="checkDuplicates" />
                </td>
                <td>
                  <select v-model.number="row.typeId" class="form-control form-control-sm"
                    @change="checkDuplicates">
                    <option :value="null">—</option>
                    <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                  <small v-if="row.duplicate" class="d-block mt-1">
                    {{ row.duplicate.kind === 'probable' ? '⚠' : 'ℹ' }}
                    <router-link :to="`/operations/${row.duplicate.id}`"
                      :class="row.duplicate.kind === 'probable' ? 'text-warning' : 'text-info'">
                      {{ row.duplicate.kind === 'probable' ? 'Probabile duplicato' : 'Verifica' }}:
                      €{{ row.duplicate.amount }} – {{ row.duplicate.note }}
                    </router-link>
                    <label class="ms-2 d-inline-flex align-items-center gap-1">
                      <input type="checkbox" class="form-check-input"
                        v-model="row.updateExisting"
                        @change="onOpUpdateExistingChange(row)" />
                      <span>aggiorna</span>
                    </label>
                  </small>
                </td>
                <td>
                  <select v-model.number="row.userId" class="form-control form-control-sm">
                    <option :value="null">—</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Withdrawals table -->
      <template v-if="withdrawalRows.length">
        <h5 class="mt-2">Prelievi contante</h5>
        <div class="table-responsive mb-3">
          <table class="table table-sm table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th style="width:2rem">
                  <input type="checkbox" class="form-check-input"
                    :checked="withdrawalRows.every(r => r.selected)"
                    :indeterminate="withdrawalRows.some(r => r.selected) && !withdrawalRows.every(r => r.selected)"
                    @change="withdrawalRows.forEach(r => r.selected = ($event.target as HTMLInputElement).checked)" />
                </th>
                <th>Data</th>
                <th style="width:7rem">Importo</th>
                <th>Nota</th>
                <th>Utente</th>
                <th style="width:5rem" class="text-center">Completo</th>
                <th style="width:5rem" class="text-center">Archiviato</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in withdrawalRows" :key="i" :class="{ 'table-warning': row.duplicate?.kind === 'probable', 'table-info': row.duplicate?.kind === 'possible', 'opacity-50': !row.selected }">
                <td class="text-center">
                  <input type="checkbox" class="form-check-input" v-model="row.selected" />
                </td>
                <td>
                  <input v-model="row.date" type="date" class="form-control form-control-sm"
                    @change="checkWithdrawalDuplicates" />
                </td>
                <td>
                  <input v-model="row.amount" type="number" step="0.01" min="0"
                    class="form-control form-control-sm" @change="checkWithdrawalDuplicates" />
                </td>
                <td>
                  <input v-model="row.note" type="text" class="form-control form-control-sm"
                    @change="checkWithdrawalDuplicates" />
                  <small v-if="row.duplicate" class="d-block mt-1">
                    {{ row.duplicate.kind === 'probable' ? '⚠' : 'ℹ' }}
                    <router-link :to="`/withdrawals/${row.duplicate.id}`"
                      :class="row.duplicate.kind === 'probable' ? 'text-warning' : 'text-info'">
                      {{ row.duplicate.kind === 'probable' ? 'Probabile duplicato' : 'Verifica' }}:
                      €{{ row.duplicate.amount }} – {{ row.duplicate.note }}
                    </router-link>
                    <label class="ms-2 d-inline-flex align-items-center gap-1">
                      <input type="checkbox" class="form-check-input"
                        v-model="row.updateExisting"
                        @change="onWdUpdateExistingChange(row)" />
                      <span>aggiorna</span>
                    </label>
                  </small>
                </td>
                <td>
                  <select v-model.number="row.userId" class="form-control form-control-sm">
                    <option :value="null">—</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                  </select>
                </td>
                <td class="text-center">
                  <input type="checkbox" class="form-check-input" v-model="row.complete" />
                </td>
                <td class="text-center">
                  <input type="checkbox" class="form-check-input" v-model="row.archive" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <button class="btn btn-primary"
        :disabled="submitting || (!selectedCount && !withdrawalSelectedCount)"
        @click="submit">
        {{ submitting ? 'Importazione…' : `Importa ${importLabel}` }}
      </button>
      <router-link to="/operations" class="btn btn-secondary ms-2">Annulla</router-link>
    </template>

    </template> <!-- end v-if="!savedResult" -->

    <!-- ── Riepilogo post-salvataggio ───────────────────────────────────────── -->
    <template v-if="savedResult">
      <div class="alert alert-success mt-3">
        Importazione completata:
        <strong>{{ savedResult.operations.length }} operazioni</strong>
        <span v-if="savedResult.withdrawals.length"> e <strong>{{ savedResult.withdrawals.length }} prelievi</strong></span>
        salvati.
      </div>

      <template v-if="savedResult.operations.length">
        <h5>Operazioni salvate</h5>
        <table class="table table-sm table-bordered mb-3">
          <thead class="table-light">
            <tr><th>Data</th><th>Nota</th><th>Importo</th><th>Categoria</th><th>Utente</th><th>Azione</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="op in savedResult.operations" :key="op.id">
              <td>{{ op.date }}</td>
              <td>{{ op.note }}</td>
              <td :class="op.sign === '-' ? 'text-danger' : 'text-success'">
                {{ op.sign === '-' ? '−' : '+' }}€{{ op.amount }}
              </td>
              <td>{{ op.type?.name }}</td>
              <td>{{ op.user?.name }}</td>
              <td>
                <span :class="op.action === 'updated' ? 'badge bg-warning text-dark' : 'badge bg-success'">
                  {{ op.action === 'updated' ? 'aggiornata' : 'creata' }}
                </span>
              </td>
              <td><router-link :to="`/operations/${op.id}`">dettaglio</router-link></td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-if="savedResult.withdrawals.length">
        <h5>Prelievi salvati</h5>
        <table class="table table-sm table-bordered mb-3">
          <thead class="table-light">
            <tr><th>Data</th><th>Nota</th><th>Importo</th><th>Azione</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="wd in savedResult.withdrawals" :key="wd.id">
              <td>{{ wd.date }}</td>
              <td>{{ wd.note }}</td>
              <td class="text-danger">−€{{ wd.amount }}</td>
              <td>
                <span :class="wd.action === 'updated' ? 'badge bg-warning text-dark' : 'badge bg-success'">
                  {{ wd.action === 'updated' ? 'aggiornato' : 'creato' }}
                </span>
              </td>
              <td><router-link :to="`/withdrawals/${wd.id}`">dettaglio</router-link></td>
            </tr>
          </tbody>
        </table>
      </template>

      <router-link to="/operations" class="btn btn-primary me-2">Vai alle operazioni</router-link>
      <button class="btn btn-secondary" @click="savedResult = null">Nuova importazione</button>
    </template>
  </div>
</template>
