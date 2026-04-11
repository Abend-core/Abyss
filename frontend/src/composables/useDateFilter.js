import { ref, computed } from 'vue'

export function useDateFilter() {
  // ── Mode de sélection ──────────────────────────────────
  const filterMode = ref('month') // 'month' | 'year' | 'custom'
  const selectedMonth = ref(null) // YYYY-MM
  const selectedYear = ref(null) // YYYY
  const customStart = ref(null) // YYYY-MM-DD
  const customEnd = ref(null) // YYYY-MM-DD

  // ── État de la modal ───────────────────────────────────
  const isModalOpen = ref(false)

  // ── Calcul de la plage active ──────────────────────────
  const dateRange = computed(() => {
    const now = new Date()
    let start, end = now

    switch (filterMode.value) {
      case 'month':
        if (!selectedMonth.value) return null
        const [year, mo] = selectedMonth.value.split('-')
        start = new Date(`${selectedMonth.value}-01`)
        // Dernier jour du mois
        end = new Date(year, parseInt(mo), 0)
        break

      case 'year':
        if (!selectedYear.value) return null
        start = new Date(`${selectedYear.value}-01-01`)
        end = new Date(`${selectedYear.value}-12-31`)
        break

      case 'custom':
        if (!customStart.value || !customEnd.value) return null
        start = new Date(customStart.value)
        end = new Date(customEnd.value)
        break

      default:
        return null
    }

    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  })

  // ── Calcul du groupement automatique selon la durée ─────
  const groupingPeriod = computed(() => {
    if (!dateRange.value) return 'day'

    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

    // Logique intelligente de groupement
    if (diffDays <= 31) return 'day'
    if (diffDays <= 180) return 'week'
    return 'month'
  })

  // ── Extraction des années et mois disponibles ──────────
  function getAvailableMonths(expenses) {
    const months = new Set()
    expenses.forEach(e => {
      if (e.date) months.add(e.date.slice(0, 7))
    })
    return Array.from(months).sort()
  }

  function getAvailableYears(expenses) {
    const years = new Set()
    expenses.forEach(e => {
      if (e.date) years.add(e.date.slice(0, 4))
    })
    return Array.from(years)
      .map(y => parseInt(y))
      .sort((a, b) => a - b)
  }

  // ── Filtrage des données ───────────────────────────────
  function filterExpensesByRange(expenses, range) {
    if (!range) return expenses

    const startDate = new Date(range.start)
    const endDate = new Date(range.end)
    endDate.setHours(23, 59, 59, 999)

    return expenses.filter(e => {
      const eDate = new Date(e.date)
      return eDate >= startDate && eDate <= endDate
    })
  }

  // ── Groupement des données selon la période ────────────
  function groupExpensesByPeriod(expenses, period) {
    if (period === 'day') {
      return groupByDay(expenses)
    } else if (period === 'week') {
      return groupByWeek(expenses)
    } else if (period === 'month') {
      return groupByMonth(expenses)
    }
    return groupByDay(expenses)
  }

  function groupByDay(expenses) {
    const grouped = new Map()

    expenses.forEach(e => {
      const date = e.date.slice(0, 10) // YYYY-MM-DD
      if (!grouped.has(date)) {
        grouped.set(date, {
          period: date,
          label: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' }),
          expenses: [],
          total: 0,
        })
      }
      grouped.get(date).expenses.push(e)
      if (e.type === 'expense') grouped.get(date).total += e.amount
    })

    return Array.from(grouped.values()).sort((a, b) => new Date(a.period) - new Date(b.period))
  }

  function groupByWeek(expenses) {
    const grouped = new Map()

    expenses.forEach(e => {
      const date = new Date(e.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1) // Lundi
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!grouped.has(weekKey)) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // Dimanche
        grouped.set(weekKey, {
          period: weekKey,
          label: `Sem. ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`,
          expenses: [],
          total: 0,
        })
      }
      grouped.get(weekKey).expenses.push(e)
      if (e.type === 'expense') grouped.get(weekKey).total += e.amount
    })

    return Array.from(grouped.values()).sort((a, b) => new Date(a.period) - new Date(b.period))
  }

  function groupByMonth(expenses) {
    const grouped = new Map()

    expenses.forEach(e => {
      const month = e.date.slice(0, 7) // YYYY-MM
      if (!grouped.has(month)) {
        grouped.set(month, {
          period: month,
          label: new Date(`${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          expenses: [],
          total: 0,
        })
      }
      grouped.get(month).expenses.push(e)
      if (e.type === 'expense') grouped.get(month).total += e.amount
    })

    return Array.from(grouped.values()).sort((a, b) => new Date(a.period) - new Date(b.period))
  }

  // ── Réinitialiser les filtres ──────────────────────────
  function resetFilters() {
    filterMode.value = 'month'
    selectedMonth.value = null
    selectedYear.value = null
    customStart.value = null
    customEnd.value = null
  }

  // ── Ouvrir/fermer la modal ────────────────────────────
  function openModal() {
    isModalOpen.value = true
  }

  function closeModal() {
    isModalOpen.value = false
  }

  function applyFilter() {
    closeModal()
  }

  return {
    // State
    filterMode,
    selectedMonth,
    selectedYear,
    customStart,
    customEnd,
    isModalOpen,

    // Computed
    dateRange,
    groupingPeriod,

    // Methods
    getAvailableMonths,
    getAvailableYears,
    filterExpensesByRange,
    groupExpensesByPeriod,
    resetFilters,
    openModal,
    closeModal,
    applyFilter,
  }
}
