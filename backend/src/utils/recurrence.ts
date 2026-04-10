/**
 * Helpers for recurrence rules and date generation.
 */

function toDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }
  return new Date(value)
}

export function formatDate(date: string | Date): string {
  const d = toDate(date)
  d.setHours(0, 0, 0, 0)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addRecurrence(date: string | Date, recurrence: string): Date {
  const nextDate = toDate(date)

  switch (recurrence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'bimonthly':
      nextDate.setMonth(nextDate.getMonth() + 2)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      throw new Error(`Récurrence inconnue : ${recurrence}`)
  }

  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

export function getRecurrenceDatesUpTo(startDate: string | Date, recurrence: string, endDate: string | Date): string[] {
  const start = toDate(startDate)
  const end = toDate(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const dates: string[] = []
  if (start > end) {
    return dates
  }

  let current = start
  while (current <= end) {
    dates.push(formatDate(current))
    current = addRecurrence(current, recurrence)
  }

  return dates
}
