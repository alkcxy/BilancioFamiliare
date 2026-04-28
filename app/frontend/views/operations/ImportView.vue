<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { parseCsv, inferSign } from '../../lib/csvParser'
import { operationService } from '../../services/operationService'
import { typeService } from '../../services/typeService'
import { userService } from '../../services/userService'
import type { Type, User } from '../../types'

const router = useRouter()

const types = ref<Type[]>([])
const users = ref<User[]>([])
const typeId = ref<number | null>(null)
const userId = ref<number | null>(null)

const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const dateCol = ref(0)
const noteCol = ref(1)
const amountCol = ref(2)

const errors = ref<string[]>([])
const submitting = ref(false)

onMounted(async () => {
  ;[types.value, users.value] = await Promise.all([typeService.getList(), userService.getList()])
})

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result as string
    const parsed = parseCsv(text)
    headers.value = parsed.headers
    rows.value = parsed.rows
    // Heuristic: pick first col containing "dat", second "nota/desc", last "import/amount"
    headers.value.forEach((h, i) => {
      const l = h.toLowerCase()
      if (/dat/.test(l)) dateCol.value = i
      else if (/not|desc/.test(l)) noteCol.value = i
      else if (/imp|amou|val/.test(l)) amountCol.value = i
    })
  }
  reader.readAsText(file)
}

const preview = computed(() =>
  rows.value.map((r) => {
    const raw = r[amountCol.value] ?? ''
    const { sign, amount } = inferSign(raw)
    return {
      date: r[dateCol.value] ?? '',
      note: r[noteCol.value] ?? '',
      sign,
      amount,
    }
  }),
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
    <h1>Importa CSV</h1>

    <div v-if="errors.length" class="alert alert-danger">
      <p v-for="e in errors" :key="e" class="mb-0">{{ e }}</p>
    </div>

    <div class="alert alert-info">
      <strong>Come funziona</strong>
      <ol class="mb-0 mt-1">
        <li>Esporta il tuo estratto conto in formato CSV dalla app della banca (o dall'home banking).</li>
        <li>Carica il file qui sotto. Il separatore (virgola o punto e virgola) viene rilevato in automatico.</li>
        <li>Verifica che le colonne <em>Data</em>, <em>Nota</em> e <em>Importo</em> puntino alle colonne giuste — l'app cerca di pre-selezionarle dai nomi dell'intestazione.</li>
        <li>Scegli una <strong>categoria</strong> e un <strong>utente</strong> da assegnare a tutte le righe importate (modificabili poi una per una).</li>
        <li>Controlla l'anteprima: il segno viene dedotto automaticamente dall'importo (negativo = uscita, positivo = entrata).</li>
        <li>Clicca <strong>Importa</strong>. Se anche una sola riga non è valida, nessuna operazione viene salvata.</li>
      </ol>
      <div class="mt-2">
        <strong>Formato data atteso:</strong> <code>YYYY-MM-DD</code> (es. <code>2024-01-15</code>).
        Se la tua banca esporta in altro formato (es. <code>15/01/2024</code>), adatta manualmente il CSV prima di caricarlo.
      </div>
    </div>

    <div class="row mb-3">
      <label for="csv-file" class="col-sm-2 col-form-label">File CSV</label>
      <div class="col-sm-10">
        <input id="csv-file" type="file" accept=".csv,.txt" class="form-control" @change="onFile" />
        <small class="text-muted">Separatore rilevato automaticamente (virgola o punto e virgola).</small>
      </div>
    </div>

    <template v-if="headers.length">
      <h5 class="mt-4">Mappa colonne</h5>
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
      <div class="row mb-2">
        <label for="col-amount" class="col-sm-2 col-form-label">Importo</label>
        <div class="col-sm-4">
          <select id="col-amount" v-model.number="amountCol" class="form-control">
            <option v-for="(h, i) in headers" :key="i" :value="i">{{ h }}</option>
          </select>
        </div>
      </div>

      <h5 class="mt-4">Categoria e utente (per tutte le righe)</h5>
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

      <h5 class="mt-2">Anteprima ({{ preview.length }} righe)</h5>
      <div class="table-responsive mb-3">
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nota</th>
              <th>Segno</th>
              <th>Importo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in preview" :key="i">
              <td>{{ r.date }}</td>
              <td>{{ r.note }}</td>
              <td :class="r.sign === '-' ? 'text-danger' : 'text-success'">{{ r.sign }}</td>
              <td>{{ r.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Importazione...' : `Importa ${preview.length} operazioni` }}
      </button>
      <router-link to="/operations" class="btn btn-secondary ms-2">Annulla</router-link>
    </template>
  </div>
</template>
