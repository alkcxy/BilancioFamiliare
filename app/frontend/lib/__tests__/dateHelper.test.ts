import { describe, it, expect } from 'vitest'
import DateHelper from '../dateHelper'

describe('DateHelper constructor', () => {
  it('parses YYYY-MM-DD string to the correct date', () => {
    const h = new DateHelper('2024-03-15')
    expect(h.date_time.getFullYear()).toBe(2024)
    expect(h.date_time.getMonth()).toBe(2) // 0-indexed
    expect(h.date_time.getDate()).toBe(15)
  })

  it('does not interpret YYYY-MM-DD as epoch milliseconds (regression: 1970 bug)', () => {
    // parseInt('2024-03-15') === 2024 → new Date(2024) === Jan 1 1970
    const h = new DateHelper('2024-03-15')
    expect(h.date_time.getFullYear()).not.toBe(1970)
  })

  it('toDDMMYYYY returns the correct string for YYYY-MM-DD input', () => {
    const h = new DateHelper('2024-03-15')
    expect(h.toDDMMYYYY()).toBe('15/3/2024')
  })

  it('parses YYYY-MM-DDTHH:MM:SS datetime string', () => {
    const h = new DateHelper('2024-03-15T10:30:00')
    expect(h.date_time.getFullYear()).toBe(2024)
    expect(h.date_time.getMonth()).toBe(2)
    expect(h.date_time.getDate()).toBe(15)
  })

  it('parses a Date object', () => {
    const d = new Date(2024, 2, 15)
    const h = new DateHelper(d)
    expect(h.date_time.getFullYear()).toBe(2024)
  })
})

describe('DateHelper.dateRepeatPreview', () => {
  it('generates preview dates starting from the given date, not 1970', () => {
    const h = new DateHelper('2024-03-15')
    const lastDate = new Date(2024, 5, 30) // June 30
    const preview = h.dateRepeatPreview(1, '1', '', '', lastDate)

    expect(preview.length).toBeGreaterThan(0)
    for (const d of preview) {
      expect(d.date_time.getFullYear()).toBe(2024)
      expect(d.date_time.getFullYear()).not.toBe(1970)
    }
  })

  it('preview first date is after the start date (daily repeat)', () => {
    const h = new DateHelper('2024-03-15')
    const lastDate = new Date(2024, 3, 15) // April 15
    const preview = h.dateRepeatPreview(1, '1', '', '', lastDate)

    expect(preview[0].date_time > new Date(2024, 2, 15)).toBe(true)
  })
})
