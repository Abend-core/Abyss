/**
 * Génère les dates futures pour une opération permanente
 * @param {string} startDate - Date au format YYYY-MM-DD
 * @param {string} recurrence - Type de récurrence (daily, weekly, biweekly, monthly, bimonthly, yearly)
 * @param {number} count - Nombre d'occurrences à générer (défaut: 12)
 * @returns {string[]} Array de dates au format YYYY-MM-DD
 */
export function generateRecurrenceDates(startDate, recurrence, count = 12) {
  const dates = []
  const start = new Date(startDate)

  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(start)

    switch (recurrence) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + i)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + i * 7)
        break
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + i * 14)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + i)
        break
      case 'bimonthly':
        nextDate.setMonth(nextDate.getMonth() + i * 2)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + i)
        break
    }

    // Format YYYY-MM-DD
    const year = nextDate.getFullYear()
    const month = String(nextDate.getMonth() + 1).padStart(2, '0')
    const day = String(nextDate.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
  }

  return dates
}