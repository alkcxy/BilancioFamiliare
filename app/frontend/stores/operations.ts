import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Operation, MaxEntry, CablePayload } from '../types'

export const useOperationsStore = defineStore('operations', () => {
  const byYear = ref<Map<number, Operation[]>>(new Map())
  const maxByYear = ref<MaxEntry[]>([])
  const freshMax = ref<Map<number, number>>(new Map())

  function maxOf(year: number): number {
    return maxByYear.value.find((e) => e.year === year)?.max ?? 0
  }

  function setYear(year: number, operations: Operation[]) {
    byYear.value.set(
      year,
      operations.filter((o) => o.year === year).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    )
    freshMax.value.set(year, maxOf(year))
  }

  function getYear(year: number): Operation[] | undefined {
    return byYear.value.get(year)
  }

  function isFresh(year: number): boolean {
    return byYear.value.has(year) && freshMax.value.get(year) === maxOf(year)
  }

  function setMax(entries: MaxEntry[]) {
    maxByYear.value = entries
  }

  function applyUpdate(data: CablePayload) {
    const year = data.year ?? (Array.isArray(data.message) ? data.message[0]?.year : data.message?.year)
    if (!year) return

    if (data.max) {
      maxByYear.value = maxByYear.value.map((entry) =>
        entry.year === year && entry.max < data.max
          ? { ...entry, max: data.max, id: data.method === 'create' ? (data.message as Operation).id : entry.id }
          : entry,
      )
    }

    const messages = (Array.isArray(data.message) ? data.message : [data.message]).filter(Boolean)

    if (data.method === 'destroy') {
      messages.forEach((msg) => removeOperation(msg.id))
      freshMax.value.set(year, maxOf(year))
    } else if (messages.length) {
      const ops = [...(byYear.value.get(year) ?? [])]
      messages.forEach((msg) => {
        msg.amount = parseFloat(msg.amount as unknown as string)
        const idx = ops.findIndex((o) => o.id === msg.id)
        if (idx === -1) {
          removeOperation(msg.id)
          ops.push(msg)
        } else {
          ops[idx] = msg
        }
      })
      if (byYear.value.has(year)) setYear(year, ops)
    }
  }

  function removeOperation(id: number) {
    byYear.value.forEach((ops, year) => {
      const filtered = ops.filter((o) => o.id !== id)
      if (filtered.length !== ops.length) byYear.value.set(year, filtered)
    })
  }

  return { byYear, maxByYear, setYear, getYear, isFresh, setMax, applyUpdate, removeOperation }
})
