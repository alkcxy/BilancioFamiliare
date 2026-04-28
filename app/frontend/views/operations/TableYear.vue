<script setup lang="ts">
import { computed } from 'vue'
import { operationService } from '../../services/operationService'
import { filterOperationsYear, sumAmounts } from '../../utils/operationsGrouping'
import { currency } from '../../utils/format'
import { MONTHS } from '../../utils/months'
import type { Operation } from '../../types'

const props = defineProps<{
  operations: Operation[]
  operationsPrev: Operation[]
  year: number
}>()

const grouped = computed(() => filterOperationsYear(props.operations))
const groupedPrev = computed(() => filterOperationsYear(props.operationsPrev))

const sortedSigns = computed(() =>
  (['-', '+'] as const).filter((s) => Object.keys(grouped.value[s]?.types ?? {}).length),
)

function sortedTypes(types: Record<string, Operation[]>) {
  return Object.entries(types).sort(([a], [b]) => a.localeCompare(b))
}

function monthSum(typeOps: Operation[], monthId: number): number {
  return sumAmounts(typeOps.filter((op) => op.month === monthId))
}

function prevMonthDiff(typeOps: Operation[], monthId: number): number | null {
  if (monthId <= 1) return null
  const cur = typeOps.filter((op) => op.month === monthId)
  if (cur.length <= 1) return null
  const prev = typeOps.filter((op) => op.month === monthId - 1)
  return sumAmounts(cur) - sumAmounts(prev)
}

function spendingLimitClass(typeOps: Operation[], monthId: number): string {
  const monthOps = typeOps.filter((op) => op.month === monthId)
  if (!monthOps.length) return ''
  const op = monthOps[0]
  const cap = operationService.spending_limit_cap({ sign: op.sign, date: op.date }, op.type, sumAmounts(monthOps))
  if (cap === 1) return 'table-danger'
  if (cap === 0) return 'table-warning'
  return ''
}

function balance(monthId: number, grp = grouped.value): number {
  return sumAmounts(grp['+']?.months[monthId] ?? []) - sumAmounts(grp['-']?.months[monthId] ?? [])
}

function cumulativeBalance(upToMonth: number): number {
  let total = 0
  for (let m = 1; m <= upToMonth; m++) total += balance(m)
  return total
}

function quarterlyBalance(qStart: number, grp = grouped.value): number {
  return balance(qStart, grp) + balance(qStart + 1, grp) + balance(qStart + 2, grp)
}

function yearBalance(ops: Operation[]): number {
  return ops.reduce((acc, op) => acc + (op.sign === '+' ? op.amount : -op.amount), 0)
}

const QUARTERS = [1, 4, 7, 10]
</script>

<template>
  <table class="table table-striped table-bordered table-sm table-hover">
    <template v-for="sign in sortedSigns" :key="sign">
      <thead>
        <tr>
          <th>{{ sign === '-' ? 'Spese' : 'Entrate' }} del {{ year }}</th>
          <th v-for="m in MONTHS" :key="m._id">
            <router-link :to="`/operations/${year}/${m.id}`">{{ m.abbr }}</router-link>
          </th>
          <th>Totale</th>
          <th>Media</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[typeName, typeOps] in sortedTypes(grouped[sign].types)" :key="typeName">
          <td>
            {{ typeName }}
            <router-link
              v-if="typeOps.length"
              :to="`/operations/new?type_id=${typeOps[0].type_id}&sign=${sign}`"
              class="btn btn-primary btn-sm float-end"
              :title="`Aggiungi ${typeName}`"
            >+</router-link>
          </td>
          <td v-for="m in MONTHS" :key="m._id" :class="spendingLimitClass(typeOps, m._id)">
            {{ currency(monthSum(typeOps, m._id)) }}
            <div v-if="prevMonthDiff(typeOps, m._id) !== null" title="Variazione rispetto al mese precedente">
              ({{ currency(prevMonthDiff(typeOps, m._id)!) }})
            </div>
          </td>
          <td>{{ currency(sumAmounts(typeOps)) }}</td>
          <td>{{ currency(sumAmounts(typeOps) / 12) }}</td>
        </tr>
        <tr>
          <th>{{ sign === '-' ? 'Spese del' : 'Entrate del' }} {{ year }}</th>
          <th v-for="m in MONTHS" :key="m._id">
            <router-link :to="`/operations/${year}/${m.id}`">{{ m.abbr }}</router-link>
          </th>
          <th>Totale</th>
          <th>Media</th>
        </tr>
        <tr>
          <th>Totale {{ sign === '-' ? 'Spese' : 'Entrate' }}</th>
          <th v-for="m in MONTHS" :key="m._id">
            {{ currency(sumAmounts(grouped[sign].months[m._id])) }}
          </th>
          <th>{{ currency(sumAmounts(operations.filter((op) => op.sign === sign))) }}</th>
          <td>-</td>
        </tr>
      </tbody>
    </template>

    <tbody>
      <tr>
        <th>Saldo</th>
        <th v-for="m in MONTHS" :key="m._id">{{ currency(balance(m._id)) }}</th>
        <th>{{ currency(yearBalance(operations)) }}</th>
        <td>-</td>
      </tr>
      <tr>
        <th>Saldo Cumulativo</th>
        <th v-for="m in MONTHS" :key="m._id">{{ currency(cumulativeBalance(m._id)) }}</th>
        <th :rowspan="2" title="Differenza tra saldo anno corrente e anno precedente">
          {{ currency(yearBalance(operations) - yearBalance(operationsPrev)) }}
        </th>
        <td>-</td>
      </tr>
      <tr>
        <th>Saldo Trimestrale</th>
        <th
          v-for="q in QUARTERS"
          :key="q"
          colspan="3"
          style="text-align:center;border-right:1px solid #ccc"
        >
          {{ currency(quarterlyBalance(q)) }}
          <br />
          <small title="Variazione rispetto allo stesso trimestre dell'anno precedente">
            Var. trim. anno prec.: ({{ currency(quarterlyBalance(q) - quarterlyBalance(q, groupedPrev)) }})
          </small>
        </th>
        <td>-</td>
      </tr>
    </tbody>
  </table>
</template>
