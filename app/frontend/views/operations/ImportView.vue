<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { parseCsv, inferSign } from '../../lib/csvParser'
import { operationService } from '../../services/operationService'
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
})

// ── CSV column mapper state ─────────────────────────────────────────────────
const headers = ref<string[]>([])
const csvRows = ref<string[][]>([])
const dateCol = ref(0)
const noteCol = ref(1)
const amountCol = ref(2)
const showColMapper = ref(false)

// ── Editable row state ──────────────────────────────────────────────────────
type DuplicateMatch = { id: number; amount: number; date: string }
type Row = {
  date: string
  note: string
  sign: '+' | '-'
  amount: string
  typeId: number | null
  userId: number | null
  selected: boolean
  duplicate: DuplicateMatch | null
}

const rows = ref<Row[]>([])

// Global fill-all defaults
const globalTypeId = ref<number | null>(null)
const globalUserId = ref<number | null>(null)

function applyGlobalType() {
  if (globalTypeId.value) rows.value.forEach(r => { r.typeId = globalTypeId.value })
  checkDuplicates()
}
function applyGlobalUser() {
  if (globalUserId.value) rows.value.forEach(r => { r.userId = globalUserId.value })
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
    const extracted: { date: string; note: string; sign: '+' | '-'; amount: string }[] = await resp.json()
    rows.value = extracted.map(r => ({
      ...r,
      typeId: globalTypeId.value,
      userId: globalUserId.value,
      selected: true,
      duplicate: null,
    }))
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
    }
  })
}

watch([dateCol, noteCol, amountCol], buildRowsFromCsv)

// ── Duplicate detection ─────────────────────────────────────────────────────
async function checkDuplicates() {
  const rowsWithType = rows.value
    .map((r, i) => ({ i, row: r }))
    .filter(({ row }) => row.typeId && row.date && row.amount)

  if (!rowsWithType.length) return

  try {
    const payload = rowsWithType.map(({ row }) => ({
      date: row.date,
      amount: parseFloat(row.amount),
      type_id: row.typeId,
    }))
    const matches: { index: number; match: DuplicateMatch }[] = await api.post(
      '/operations/check_duplicates.json',
      { rows: payload },
    )

    // reset all duplicates first
    rows.value.forEach(r => { r.duplicate = null })

    matches.forEach(({ index, match }) => {
      const realIndex = rowsWithType[index]?.i
      if (realIndex !== undefined) {
        rows.value[realIndex].duplicate = match
        rows.value[realIndex].selected = false  // deselect duplicates
      }
    })
  } catch {
    // silently ignore duplicate check errors
  }
}

// ── Submit ──────────────────────────────────────────────────────────────────
async function submit() {
  errors.value = []
  const selected = rows.value.filter(r => r.selected)
  if (!selected.length) { errors.value.push('Nessuna riga selezionata.'); return }
  if (selected.some(r => !r.typeId)) { errors.value.push('Alcune righe selezionate non hanno una categoria.'); return }
  if (selected.some(r => !r.userId)) { errors.value.push('Alcune righe selezionate non hanno un utente.'); return }

  submitting.value = true
  try {
    const ops = selected.map(r => ({
      date: r.date,
      sign: r.sign,
      amount: parseFloat(r.amount),
      type_id: r.typeId!,
      user_id: r.userId!,
      note: r.note,
    }))
    const res = await operationService.bulkCreate(ops)
    router.push(`/operations?imported=${res.created}`)
  } catch {
    errors.value.push("Errore durante l'importazione. Riprova.")
  } finally {
    submitting.value = false
  }
}

const selectedCount = computed(() => rows.value.filter(r => r.selected).length)
const duplicateCount = computed(() => rows.value.filter(r => r.duplicate).length)
</script>

<template>
  <div>
    <h1>Importa operazioni</h1>

    <div class="alert alert-info">
      <strong>Come funziona</strong>
      <ol class="mb-0 mt-1">
        <li>Carica uno <strong>screenshot, PDF</strong> o <strong>CSV</strong> dell'estratto conto.</li>
        <li>Controlla l'anteprima: modifica ogni campo, seleziona le righe da salvare.</li>
        <li>Le righe che sembrano già presenti a bilancio vengono <strong>deselezionate automaticamente</strong> (badge arancione).</li>
        <li>Clicca <strong>Importa</strong> per salvare solo le righe selezionate.</li>
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

    <template v-if="rows.length">
      <!-- Global fill-all -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-auto"><small class="text-muted fw-semibold">Applica a tutte:</small></div>
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
              <span v-if="duplicateCount" class="badge bg-warning text-dark">{{ duplicateCount }} possibili duplicati</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Editable table -->
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
            <tr v-for="(row, i) in rows" :key="i" :class="{ 'table-warning': !!row.duplicate, 'opacity-50': !row.selected }">
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
                <small v-if="row.duplicate" class="text-warning d-block mt-1">
                  ⚠ già presente (€{{ row.duplicate.amount }})
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

      <button class="btn btn-primary" :disabled="submitting || !selectedCount" @click="submit">
        {{ submitting ? 'Importazione…' : `Importa ${selectedCount} operazioni` }}
      </button>
      <router-link to="/operations" class="btn btn-secondary ms-2">Annulla</router-link>
    </template>
  </div>
</template>
