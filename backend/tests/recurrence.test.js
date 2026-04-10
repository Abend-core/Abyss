import { describe, it, expect } from 'vitest'
import { formatDate, getRecurrenceDatesUpTo } from '../src/utils/recurrence.ts'

describe('Recurrence utils', () => {
  it('formats dates to YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-10T14:30:00Z'))).toBe('2026-04-10')
  })

  it('returns monthly dates up to today', () => {
    const dates = getRecurrenceDatesUpTo('2026-01-10', 'monthly', '2026-04-10')
    expect(dates).toEqual(['2026-01-10', '2026-02-10', '2026-03-10', '2026-04-10'])
  })

  it('returns dates for biweekly recurrence', () => {
    const dates = getRecurrenceDatesUpTo('2026-04-01', 'biweekly', '2026-04-30')
    expect(dates).toEqual(['2026-04-01', '2026-04-15', '2026-04-29'])
  })

  it('returns no dates if start date is in the future', () => {
    expect(getRecurrenceDatesUpTo('2026-12-01', 'monthly', '2026-04-10')).toEqual([])
  })
})
