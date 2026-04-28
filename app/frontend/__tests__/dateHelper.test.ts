import { describe, it, expect } from 'vitest'
import DateHelper from '../lib/dateHelper'

describe('DateHelper#dayOfMonthExact', () => {
  it('sets the date to the exact day of the target month', () => {
    const helper = new DateHelper('2026-01-15')
    const date = new Date(2026, 0, 15)
    helper.dayOfMonthExact(date, 1, 15)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(1) // February
    expect(date.getDate()).toBe(15)
  })

  it('clamps to last day of month when day does not exist', () => {
    const helper = new DateHelper('2026-01-31')
    const date = new Date(2026, 0, 31)
    helper.dayOfMonthExact(date, 1, 31) // February 2026 has 28 days
    expect(date.getMonth()).toBe(1) // February
    expect(date.getDate()).toBe(28)
  })

  it('handles last day of 30-day month correctly', () => {
    const helper = new DateHelper('2026-01-31')
    const date = new Date(2026, 0, 31)
    helper.dayOfMonthExact(date, 3, 31) // April has 30 days
    expect(date.getMonth()).toBe(3) // April
    expect(date.getDate()).toBe(30)
  })
})

describe('DateHelper#dateRepeatPreview with day_of_month_repeat', () => {
  it('generates dates on the exact day of month', () => {
    const helper = new DateHelper('2026-01-15')
    const lastDate = new Date(2026, 6, 15) // July 15
    const results = helper.dateRepeatPreview('1', '3', '', '', lastDate, '15')
    expect(results).toHaveLength(6)
    results.forEach((d: DateHelper) => {
      expect(d.date_time.getDate()).toBe(15)
    })
  })

  it('generates correct month sequence', () => {
    const helper = new DateHelper('2026-01-15')
    const lastDate = new Date(2026, 3, 15) // April 15
    const results = helper.dateRepeatPreview('1', '3', '', '', lastDate, '15')
    expect(results).toHaveLength(3)
    expect(results[0].date_time.getMonth()).toBe(1) // February
    expect(results[1].date_time.getMonth()).toBe(2) // March
    expect(results[2].date_time.getMonth()).toBe(3) // April
  })
})

describe('DateHelper#dateRepeatPreview weekday-based monthly (regression)', () => {
  it('generates dates on the correct weekday', () => {
    // Every 1st Monday starting from 2026-01-05 (a Monday)
    const helper = new DateHelper('2026-01-05')
    const lastDate = new Date(2026, 2, 31) // March 31
    const results = helper.dateRepeatPreview('1', '3', '1', '1', lastDate, '')
    expect(results).toHaveLength(2)
    results.forEach((d: DateHelper) => {
      expect(d.date_time.getDay()).toBe(1) // Monday
      expect(d.date_time.getDate()).toBeLessThanOrEqual(7) // 1st week
    })
  })

  it('returns empty array when week_repeat is missing and day_of_month_repeat is also missing', () => {
    const helper = new DateHelper('2026-01-15')
    const lastDate = new Date(2026, 6, 15)
    const results = helper.dateRepeatPreview('1', '3', '', '', lastDate, '')
    expect(results).toHaveLength(0)
  })
})
