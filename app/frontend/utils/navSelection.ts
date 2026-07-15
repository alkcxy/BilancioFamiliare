export interface NavSelection {
  year: number | null
  month: string | null
}

type RouteParams = Record<string, string | string[] | undefined>

export function navSelection(params: RouteParams): NavSelection {
  if (typeof params.year !== 'string') return { year: null, month: null }
  return {
    year: Number(params.year),
    month: typeof params.month === 'string' ? params.month.padStart(2, '0') : null,
  }
}
