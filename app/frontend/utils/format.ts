export function currency(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}
