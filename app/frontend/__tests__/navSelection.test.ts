import { describe, it, expect } from 'vitest'
import { navSelection } from '../utils/navSelection'

/**
 * Navbar year/month selection derived from the current route params only.
 *
 * - Month route (/operations/:year/:month) selects both year and month.
 * - Year route (/operations/year/:year) selects the year, month stays generic.
 * - Any other route resets both to the generic labels.
 */
describe('navSelection', () => {
  it('selects year and month on a month route', () => {
    expect(navSelection({ year: '2026', month: '02' })).toEqual({
      year: 2026,
      month: '02',
    })
  })

  it('selects only the year on a year route', () => {
    expect(navSelection({ year: '2025' })).toEqual({ year: 2025, month: null })
  })

  it('resets everything on unrelated routes', () => {
    expect(navSelection({})).toEqual({ year: null, month: null })
    expect(navSelection({ id: '42' })).toEqual({ year: null, month: null })
  })

  it('normalizes single-digit months from manually typed URLs', () => {
    expect(navSelection({ year: '2025', month: '2' })).toEqual({
      year: 2025,
      month: '02',
    })
  })
})
