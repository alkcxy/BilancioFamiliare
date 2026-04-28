<script setup lang="ts">
import { ref, computed } from 'vue'
import { operationService } from '../../services/operationService'
import { filterOperationsMonth, sumAmounts } from '../../utils/operationsGrouping'
import { currency } from '../../utils/format'
import type { Operation } from '../../types'

const props = defineProps<{ operations: Operation[] }>()
const emit = defineEmits<{ destroy: [id: number] }>()

const grouped = computed(() => filterOperationsMonth(props.operations))
const sortedSigns = computed(() => (['-', '+'] as const).filter((s) => Object.keys(grouped.value[s] ?? {}).length))

function sortedTypes(group: Record<string, Operation[]>) {
  return Object.entries(group).sort(([a], [b]) => a.localeCompare(b))
}

function spendingLimitClass(typeOps: Operation[]): string {
  if (!typeOps.length) return ''
  const op = typeOps[0]
  const cap = operationService.spending_limit_cap({ sign: op.sign, date: op.date }, op.type, sumAmounts(typeOps))
  if (cap === 1) return 'table-danger'
  if (cap === 0) return 'table-warning'
  return ''
}

function spendingLimitEntry(op: Operation) {
  if (!op.type.spending_limit) return null
  return operationService.spending_limit_amount(op.type.spending_limit, op.date)
}

function signTotal(sign: string): number {
  return sumAmounts(props.operations.filter((op) => op.sign === sign))
}

const monthBalance = computed(() =>
  props.operations.reduce((acc, op) => acc + (op.sign === '+' ? op.amount : -op.amount), 0),
)

const activeNote = ref<number | null>(null)

function toggleNote(id: number) {
  activeNote.value = activeNote.value === id ? null : id
}
</script>

<template>
  <table class="table table-hover" @click="activeNote = null">
    <thead>
      <tr>
        <th>Tipo</th>
        <th>Subtotale</th>
        <th>Giorno</th>
        <th>Utente</th>
        <th>Importo</th>
        <th>Note</th>
        <th colspan="3"></th>
      </tr>
    </thead>

    <template v-for="sign in sortedSigns" :key="sign">
      <tbody>
        <tr><th colspan="9">{{ sign === '-' ? 'Uscite' : 'Entrate' }}</th></tr>
      </tbody>

      <tbody
        v-for="[typeName, typeOps] in sortedTypes(grouped[sign])"
        :key="`${sign}-${typeName}`"
      >
        <tr v-for="(op, i) in typeOps" :key="op.id" :class="i === 0 ? spendingLimitClass(typeOps) : ''">
          <td v-if="i === 0" :rowspan="typeOps.length">
            {{ typeName }}
            <router-link
              :to="`/operations/new?type_id=${op.type_id}&sign=${op.sign}`"
              class="btn btn-info btn-sm float-end"
              :title="`Aggiungi ${typeName}`"
            >+</router-link>
          </td>
          <td v-if="i === 0" :rowspan="typeOps.length">
            {{ currency(sumAmounts(typeOps)) }}
            <template v-if="op.sign === '-' && op.type.spending_roof">
              <br />
              <small v-if="!op.type.spending_limit || !spendingLimitEntry(op)">
                Tetto: ({{ currency(op.type.spending_roof) }})
              </small>
              <small v-else-if="spendingLimitEntry(op)">
                Tetto: ({{ currency(spendingLimitEntry(op)!.amount) }})
              </small>
            </template>
          </td>
          <td>{{ op.day }}</td>
          <td>{{ op.user.name }}</td>
          <td :class="op.sign === '-' ? 'negative' : ''">{{ currency(op.amount) }}</td>
          <td>
            <div v-if="op.note" style="position:relative">
              <button type="button" class="btn btn-info btn-sm" @click.stop="toggleNote(op.id)">Note</button>
              <div
                v-if="activeNote === op.id"
                class="card shadow"
                style="position:absolute;z-index:1050;min-width:200px;max-width:320px;left:0;top:110%"
              >
                <div class="card-body p-2">
                  <small style="white-space:pre-wrap">{{ op.note }}</small>
                </div>
              </div>
            </div>
          </td>
          <td><router-link :to="`/operations/${op.id}`" class="btn btn-primary btn-sm">ℹ</router-link></td>
          <td><router-link :to="`/operations/${op.id}/edit`" class="btn btn-warning btn-sm">✏</router-link></td>
          <td><button class="btn btn-danger btn-sm" @click="emit('destroy', op.id)">🗑</button></td>
        </tr>
      </tbody>

      <tbody>
        <tr>
          <th colspan="2">Totale {{ sign === '-' ? 'Spese' : 'Entrate' }}: {{ currency(signTotal(sign)) }}</th>
          <th colspan="7"></th>
        </tr>
      </tbody>
    </template>

    <tbody>
      <tr>
        <th>Saldo</th>
        <th>{{ currency(monthBalance) }}</th>
        <th colspan="7"></th>
      </tr>
    </tbody>
  </table>
</template>
