import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Operation, MaxEntry, CablePayload } from '../types'

export const useOperationsStore = defineStore('operations', () => {
  const byYear = ref<Map<number, Operation[]>>(new Map())
  const maxByYear = ref<MaxEntry[]>([])

  function setYear(year: number, operations: Operation[]) {
    byYear.value.set(year, operations)
  }

  function getYear(year: number): Operation[] | undefined {
    return byYear.value.get(year)
  }

  function setMax(entries: MaxEntry[]) {
    maxByYear.value = entries
  }

  function applyUpdate(data: CablePayload) {
    const year = data.year ?? (Array.isArray(data.message) ? data.message[0]?.year : data.message?.year)
    if (!year || !byYear.value.has(year)) return

    const ops = [...(byYear.value.get(year) ?? [])]

    if (data.method === 'create') {
      const op = data.message as Operation
      op.amount = parseFloat(op.amount as unknown as string)
      ops.push(op)
    } else {
      const messages = Array.isArray(data.message) ? data.message : [data.message]
      messages.forEach((msg) => {
        const idx = ops.findIndex((o) => o.id === msg.id)
        if (idx === -1) return
        if (data.method === 'update') {
          msg.amount = parseFloat(msg.amount as unknown as string)
          ops[idx] = msg
        } else if (data.method === 'destroy') {
          ops.splice(idx, 1)
        }
      })
    }

    byYear.value.set(year, ops)

    if (data.max) {
      maxByYear.value = maxByYear.value.map((entry) =>
        entry.year === year && entry.max < data.max
          ? { ...entry, max: data.max, id: data.method === 'create' ? (data.message as Operation).id : entry.id }
          : entry,
      )
    }
  }

  function removeOperation(id: number) {
    byYear.value.forEach((ops, year) => {
      const filtered = ops.filter((o) => o.id !== id)
      if (filtered.length !== ops.length) byYear.value.set(year, filtered)
    })
  }

  return { byYear, maxByYear, setYear, getYear, setMax, applyUpdate, removeOperation }
})
