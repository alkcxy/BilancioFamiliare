<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { parseCsv, inferSign } from '../../lib/csvParser'
import { operationService } from '../../services/operationService'
import { typeService } from '../../services/typeService'
import { userService } from '../../services/userService'
import { useAuthStore } from '../../stores/auth'
import type { Type, User } from '../../types'

const router = useRouter()
const auth = useAuthStore()

const types = ref<Type[]>([])
const users = ref<User[]>([])
const typeId = ref<number | null>(null)
const userId = ref<number | null>(null)

const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const dateCol = ref(0)
const noteCol = ref(1)
const amountCol = ref(2)
const showColMapper = ref(false)

const extractedRows = ref<{ date: string; note: string; sign: '+' | '-'; amount: string }[]>([])
const extracting = ref(false)
const errors = ref<string[]>([])
const submitting = ref(false)

onMounted(async () => {
  ;[types.value, users.value] = await Promise.all([typeService.getList(), userService.getList()])
})

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const PDF_TYPE = 'application/pdf'
const CSV_TYPES = ['text/csv', 'text/plain', 'application/vnd.ms-excel']

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  errors.value = []
  extractedRows.value = []
  showColMapper.value = false

  if (IMAGE_TYPES.includes(file.type) || file.type === PDF_TYPE) {
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
    extractedRows.value = await resp.json()
  } catch {
    errors.value.push('Errore di rete durante l\'estrazione.')
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
    rows.value = parsed.rows
    headers.value.forEach((h, i) => {
      const l = h.toLowerCase()
      if (/dat/.test(l)) dateCol.value = i
      else if (/not|desc/.test(l)) noteCol.value = i
      else if (/imp|amou|val/.test(l)) amountCol.value = i
    })
    showColMapper.value = true
  }
  reader.readAsText(file)
}

const csvPreview = computed(() =>
  rows.value.map((r) => {
    const raw = r[amountCol.value] ?? ''
    const { sign, amount } = inferSign(raw)
    return { date: r[dateCol.value] ?? '', note: r[noteCol.value] ?? '', sign, amount }
  }),
)

const preview = computed(() =>
  extractedRows.value.length ? extractedRows.value : csvPreview.value,
)

async function submit() {
  errors.value = []
  if (!typeId.value) { errors.value.push('Seleziona una categoria.'); return }
  if (!userId.value) { errors.value.push('Seleziona un utente.'); return }
  if (!preview.value.length) { errors.value.push('Nessuna riga da importare.'); return }

  submitting.value = true
  try {
    const ops = preview.value.map((r) => ({
      date: r.date,
      sign: r.sign,
      amount: parseFloat(r.amount),
      type_id: typeId.value!,
      user_id: userId.value!,
      note: r.note,
    }))
    const res = await operationService.bulkCreate(ops)
    router.push(`/operations?imported=${res.created}`)
  } catch {
    errors.value.push('Errore durante l\'importazione. Riprova.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <h1>Importa operazioni</h1>

    <div class="alert alert-info">
      <strong>Come funziona</strong>
      <ol class="mb-0 mt-1">
        <li>Fai uno <strong>screenshot</strong> dell'estratto conto dalla app della tua banca, oppure esporta il PDF o il CSV.</li>
        <li>Carica il file qui sotto.
          <ul class="mb-0">
            <li><strong>Immagine o PDF</strong>: le transazioni vengono estratte automaticamente dall'AI (Claude Haiku). Costo stimato: &lt; 1 centesimo per estrazione.</li>
            <li><strong>CSV</strong>: il file viene parsato localmente. Il separatore (virgola o punto e virgola) è rilevato in automatico. La data deve essere in formato <code>YYYY-MM-DD</code>.</li>
          </ul>
        </li>
        <li>Controlla l'<strong>anteprima</strong>: verifica date, note e segno (rosso = uscita, verde = entrata).</li>
        <li>Scegli una <strong>categoria</strong> e un <strong>utente</strong> per tutte le righe, poi clicca <strong>Importa</strong>.</li>
        <li>Se anche una sola riga non è valida, nessuna operazione viene salvata.</li>
      </ol>
    </div>

    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>

    <div class="row mb-3">
      <label for="csv-file" class="col-sm-2 col-form-label">File</label>
      <div class="col-sm-10">
        <input
          id="csv-file"
          type="file"
          accept=".csv,.txt,.png,.jpg,.jpeg,.gif,.webp,.pdf"
          class="form-control"
          :disabled="extracting"
          @change="onFile"
        />
        <small class="text-muted">Immagine (PNG, JPG, GIF, WebP), PDF o CSV.</small>
      </div>
    </div>

    <div v-if="extracting" class="text-muted mb-3">
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Estrazione in corso con AI…
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

    <template v-if="preview.length">
      <h5 class="mt-2">Categoria e utente <small class="text-muted">(per tutte le righe)</small></h5>
      <div class="row mb-2">
        <label for="import-type" class="col-sm-2 col-form-label">Categoria</label>
        <div class="col-sm-4">
          <select id="import-type" v-model.number="typeId" class="form-control">
            <option :value="null" disabled>— seleziona —</option>
            <option v-for="t in types" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>
      <div class="row mb-3">
        <label for="import-user" class="col-sm-2 col-form-label">Utente</label>
        <div class="col-sm-4">
          <select id="import-user" v-model.number="userId" class="form-control">
            <option :value="null" disabled>— seleziona —</option>
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
      </div>

      <h5>Anteprima <span class="badge bg-secondary">{{ preview.length }} righe</span></h5>
      <div class="table-responsive mb-3">
        <table class="table table-sm table-bordered">
          <thead>
            <tr><th>Data</th><th>Nota</th><th>Segno</th><th>Importo</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in preview" :key="i">
              <td>{{ r.date }}</td>
              <td>{{ r.note }}</td>
              <td :class="r.sign === '-' ? 'text-danger fw-bold' : 'text-success fw-bold'">{{ r.sign }}</td>
              <td>{{ r.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Importazione…' : `Importa ${preview.length} operazioni` }}
      </button>
      <router-link to="/operations" class="btn btn-secondary ms-2">Annulla</router-link>
    </template>
  </div>
</template>
