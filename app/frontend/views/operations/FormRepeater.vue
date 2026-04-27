<script setup lang="ts">
import { computed, watch } from 'vue'
import DateHelper from '../../lib/dateHelper'

const props = defineProps<{
  date: string
  repeat: number
  intervalRepeat: number | null
  typeRepeat: string
  weekRepeat: string
  wdayRepeat: string
  lastDateRepeat: string
}>()

const emit = defineEmits<{
  'update:repeat': [v: number]
  'update:intervalRepeat': [v: number | null]
  'update:typeRepeat': [v: string]
  'update:weekRepeat': [v: string]
  'update:wdayRepeat': [v: string]
  'update:lastDateRepeat': [v: string]
}>()

const typesRepeat = [
  { id: '1', name: 'Giorni' },
  { id: '2', name: 'Settimane' },
  { id: '3', name: 'Mesi' },
]
const weeksRepeat = [
  { id: '1', name: 'Primo' }, { id: '2', name: 'Secondo' },
  { id: '3', name: 'Terzo' }, { id: '4', name: 'Quarto' }, { id: '5', name: 'Ultimo' },
]
const wdaysRepeat = [
  { id: '1', name: 'Lunedì' }, { id: '2', name: 'Martedì' }, { id: '3', name: 'Mercoledì' },
  { id: '4', name: 'Giovedì' }, { id: '5', name: 'Venerdì' }, { id: '6', name: 'Sabato' }, { id: '0', name: 'Domenica' },
]

const preview = computed(() => {
  if (
    !props.repeat ||
    !props.intervalRepeat ||
    !props.typeRepeat ||
    !props.lastDateRepeat ||
    !props.date
  ) return []
  try {
    const helper = new DateHelper(props.date)
    const lastDate = new Date(props.lastDateRepeat)
    return helper.dateRepeatPreview(
      props.intervalRepeat,
      props.typeRepeat,
      props.weekRepeat ?? '',
      props.wdayRepeat ?? '',
      lastDate,
    )
  } catch {
    return []
  }
})
</script>

<template>
  <div>
    <div class="row mb-3">
      <label class="col-sm-2 col-form-label">Ripetizione</label>
      <div class="col-sm-10">
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            :checked="repeat === 1"
            @change="emit('update:repeat', ($event.target as HTMLInputElement).checked ? 1 : 0)"
          />
          <label class="form-check-label">
            Ripeti periodicamente
          </label>
        </div>
        <small class="text-muted">Se l'operazione si ripete periodicamente spunta il check.</small>
      </div>
    </div>

    <template v-if="repeat === 1">
      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Ogni</label>
        <div class="col-sm-10 d-flex gap-2">
          <input
            type="number" step="1" min="1" class="form-control" style="max-width:100px"
            :value="intervalRepeat ?? ''"
            @input="emit('update:intervalRepeat', Number(($event.target as HTMLInputElement).value) || null)"
          />
          <select
            class="form-control" style="max-width:160px"
            :value="typeRepeat"
            @change="emit('update:typeRepeat', ($event.target as HTMLSelectElement).value)"
          >
            <option value=""></option>
            <option v-for="t in typesRepeat" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="typeRepeat === '2' || typeRepeat === '3'" class="row mb-3">
        <label class="col-sm-2 col-form-label">Il</label>
        <div class="col-sm-10 d-flex gap-2">
          <select
            v-if="typeRepeat === '3'"
            class="form-control" style="max-width:130px"
            :value="weekRepeat"
            @change="emit('update:weekRepeat', ($event.target as HTMLSelectElement).value)"
          >
            <option value=""></option>
            <option v-for="w in weeksRepeat" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
          <select
            class="form-control" style="max-width:130px"
            :value="wdayRepeat"
            @change="emit('update:wdayRepeat', ($event.target as HTMLSelectElement).value)"
          >
            <option value=""></option>
            <option v-for="d in wdaysRepeat" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <span v-if="typeRepeat === '3'" class="align-self-center">del mese</span>
        </div>
      </div>

      <div class="row mb-3">
        <label class="col-sm-2 col-form-label">Ultima data ripetizione</label>
        <div class="col-sm-10">
          <input
            type="date" class="form-control" style="max-width:200px"
            :value="lastDateRepeat"
            @change="emit('update:lastDateRepeat', ($event.target as HTMLInputElement).value)"
          />
          <small class="text-muted">Ultima data entro cui può iniziare l'ultima ripetizione.</small>
        </div>
      </div>

      <div v-if="preview.length" class="row mb-3">
        <label class="col-sm-2 col-form-label">Anteprima date</label>
        <div class="col-sm-10">
          <ul class="list-unstyled mb-0">
            <li v-for="(d, i) in preview" :key="i" class="text-muted small">{{ d.toDDMMYYYY() }}</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
