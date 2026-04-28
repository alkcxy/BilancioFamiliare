import type { Operation } from '../types'

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC8A4', '#E7E9ED', '#FDB45C']

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

export interface ChartDatasets {
  perYear: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string }[] }
  perDayBySign: { cat: string; data: { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[] }[] } }[]
  perMonthBySign: { cat: string; byYear: { year: string; data: { labels: string[]; datasets: { label: string; data: number[] }[] } }[] }[]
  saldoToday: number
}

export function buildChartData(operations: Operation[]): ChartDatasets {
  const bySign = groupBy(operations, (op) => op.sign)

  // perYear: total per year grouped by sign
  const allYears = new Set<string>()
  const signTotals: Record<string, Record<string, number>> = {}

  for (const [sign, ops] of Object.entries(bySign)) {
    const label = sign === '-' ? 'Uscite' : 'Entrate'
    signTotals[label] = {}
    const byYear = groupBy(ops, (op) => String(op.year))
    for (const [year, yearOps] of Object.entries(byYear)) {
      allYears.add(year)
      signTotals[label][year] = Math.round(sum(yearOps.map((o) => o.amount)) * 100) / 100
    }
  }

  const yearLabels = Array.from(allYears).sort()
  const perYear = {
    labels: yearLabels,
    datasets: Object.entries(signTotals).map(([label, byYear]) => ({
      label,
      data: yearLabels.map((y) => byYear[y] ?? 0),
      backgroundColor: label === 'Uscite' ? '#FF6384' : '#36A2EB',
    })),
  }

  // perDayBySign: daily average per type grouped by sign
  const perDayBySign = Object.entries(bySign).map(([sign, ops]) => {
    const cat = sign === '-' ? 'Uscite' : 'Entrate'
    const byType = groupBy(ops, (op) => op.type.name)
    const labels: string[] = []
    const data: number[] = []

    for (const [typeName, typeOps] of Object.entries(byType)) {
      let minDate = 0, maxDate = 0
      for (const op of typeOps) {
        const d = op.year * 10000 + op.month * 100 + op.day
        if (minDate === 0 || d < minDate) minDate = d
        if (maxDate === 0 || d > maxDate) maxDate = d
      }
      const ms = String(maxDate)
      const maxD = new Date(parseInt(ms.substring(0, 4)), parseInt(ms.substring(4, 6)) - 1, parseInt(ms.substring(6)))
      const minD = new Date(Math.floor(minDate / 10000), 0, 1)
      const totDays = (86400000 + (maxD.getTime() - minD.getTime())) / 86400000
      const totAmount = sum(typeOps.map((o) => o.amount))
      labels.push(typeName)
      data.push(Math.round((totAmount / totDays) * 100) / 100)
    }

    return {
      cat,
      data: {
        labels,
        datasets: [{ label: cat, data, backgroundColor: COLORS.slice(0, labels.length) }],
      },
    }
  })

  // perMonthBySign: monthly amounts per type grouped by sign and year
  const perMonthBySign = Object.entries(bySign).map(([sign, ops]) => {
    const cat = sign === '-' ? 'Uscite' : 'Entrate'
    const byType = groupBy(ops, (op) => op.type.name)
    const yearMap: Record<string, { label: string; data: number[] }[]> = {}

    for (const [typeName, typeOps] of Object.entries(byType)) {
      const byYear = groupBy(typeOps, (op) => String(op.year))
      for (const [year, yearOps] of Object.entries(byYear)) {
        if (!yearMap[year]) yearMap[year] = []
        const monthly = new Array(12).fill(0) as number[]
        for (const op of yearOps) monthly[op.month - 1] += op.amount
        yearMap[year].push({ label: typeName, data: monthly })
      }
    }

    const byYear = Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, datasets]) => ({ year, data: { labels: MONTH_LABELS, datasets } }))

    return { cat, byYear }
  })

  // saldoToday
  const today = new Date()
  let saldoToday = 0
  for (const op of operations) {
    const isBeforeToday =
      op.year < today.getFullYear() ||
      (op.year === today.getFullYear() && op.month < today.getMonth() + 1) ||
      (op.year === today.getFullYear() && op.month === today.getMonth() + 1 && op.day < today.getDate())
    if (isBeforeToday) saldoToday += op.sign === '+' ? op.amount : -op.amount
  }

  return { perYear, perDayBySign, perMonthBySign, saldoToday }
}
