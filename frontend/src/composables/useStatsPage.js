import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '@/composables/useApi.js'
import { useDateFilter } from '@/composables/useDateFilter.js'
import { useAppStore } from '@/stores/app.store.js'

export function useStatsPage() {
  const { api } = useApi()
  const appStore = useAppStore()
  const dateFilter = useDateFilter()

  // ── État ──────────────────────────────────────────
  const filteredExpenses = ref([])
  const kpiData = ref({
    totalExpenses: 0,
    totalCredits: 0,
    netBalance: 0,
    monthlyAverage: 0,
    recurringCount: 0,
  })
  const otherStats = ref({
    transactionCount: 0,
    totalExpenses: 0,
    totalCredits: 0,
    averageExpense: 0,
    averageCredit: 0,
    topCategory: 'Aucune',
  })
  const source = ref('kpis')
  const categories = ref([])
  const isLoading = ref(false)
  const currency = ref('€')
  const availableMonths = ref([])
  const availableYears = ref([])

  const groupedExpenses = computed(() => {
    return dateFilter.groupExpensesByPeriod(filteredExpenses.value, dateFilter.groupingPeriod.value)
  })

  const groupingPeriodLabel = computed(() => {
    const period = dateFilter.groupingPeriod.value
    const labels = {
      day: '📅 Par jour',
      week: '📊 Par semaine',
      month: '📈 Par mois',
    }
    return labels[period] || 'Auto'
  })

  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  watch(availableMonths, (months) => {
    if (!dateFilter.selectedMonth.value && months.length > 0) {
      const currentMonth = getCurrentMonth()
      dateFilter.selectedMonth.value = months.includes(currentMonth)
        ? currentMonth
        : months[months.length - 1]
      dateFilter.filterMode.value = 'month'
    }
  }, { immediate: true })

  watch(availableYears, (years) => {
    if (!dateFilter.selectedYear.value && years.length > 0 && dateFilter.filterMode.value === 'year') {
      const currentYear = new Date().getFullYear()
      dateFilter.selectedYear.value = years.includes(currentYear)
        ? currentYear
        : years[years.length - 1]
    }
  }, { immediate: true })

  watch(() => dateFilter.filterMode.value, (newMode) => {
    if (newMode === 'year' && !dateFilter.selectedYear.value && availableYears.value.length > 0) {
      const currentYear = new Date().getFullYear()
      dateFilter.selectedYear.value = availableYears.value.includes(currentYear)
        ? currentYear
        : availableYears.value[availableYears.value.length - 1]
    }
  })

  const activeFilterLabel = computed(() => {
    const range = dateFilter.dateRange.value
    if (!range) return 'Aucun filtre actif'

    const format = (value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

    if (dateFilter.filterMode.value === 'month' && dateFilter.selectedMonth.value) {
      const [year, month] = dateFilter.selectedMonth.value.split('-')
      return `Mois : ${new Date(`${year}-${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    }

    if (dateFilter.filterMode.value === 'year' && dateFilter.selectedYear.value) {
      return `Année : ${dateFilter.selectedYear.value}`
    }

    if (dateFilter.filterMode.value === 'custom' && dateFilter.customStart.value && dateFilter.customEnd.value) {
      return `Plage : ${format(dateFilter.customStart.value)} → ${format(dateFilter.customEnd.value)}`
    }

    return 'Filtre actif'
  })

  // ── KPIs (calculés sur les données filtrées) ──────────
  const totalExpenses = computed(() => kpiData.value.totalExpenses)
  const totalCredits = computed(() => kpiData.value.totalCredits)
  const netBalance = computed(() => kpiData.value.netBalance)
  const monthlyAverage = computed(() => kpiData.value.monthlyAverage)
  const recurringCount = computed(() => kpiData.value.recurringCount)

  // ── Data loading ──────────────────────────────────
  async function loadPeriods() {
    const [periodsRes, catsRes, userRes] = await Promise.allSettled([
      api('/api/user/expenses/months'),
      api('/api/categories'),
      api('/api/user'),
    ])

    if (periodsRes.status === 'fulfilled') {
      const res = periodsRes.value
      availableMonths.value = res?.months ?? []
      availableYears.value = res?.years ?? []
    } else {
      const fallbackRes = await api('/api/user/expenses/periods').catch(() => null)
      if (fallbackRes) {
        availableMonths.value = fallbackRes.months ?? []
        availableYears.value = fallbackRes.years ?? []
      }
    }

    if (dateFilter.filterMode.value === 'year' && !dateFilter.selectedYear.value && availableYears.value.length > 0) {
      const currentYear = new Date().getFullYear()
      dateFilter.selectedYear.value = availableYears.value.includes(currentYear)
        ? currentYear
        : availableYears.value[availableYears.value.length - 1]
    }

    if (catsRes.status === 'fulfilled') categories.value = catsRes.value ?? []
    if (userRes.status === 'fulfilled') {
      const cur = userRes.value.settings?.currency || 'EUR'
      currency.value = { EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF', AUD: 'A$' }[cur] || cur
    }

    if (!dateFilter.dateRange.value && availableMonths.value.length > 0) {
      const currentMonth = getCurrentMonth()
      dateFilter.selectedMonth.value = availableMonths.value.includes(currentMonth)
        ? currentMonth
        : availableMonths.value[availableMonths.value.length - 1]
      dateFilter.filterMode.value = 'month'
    }

    // Initialize year filter if no range is set and years are available
    if (!dateFilter.dateRange.value && availableYears.value.length > 0 && dateFilter.filterMode.value === 'year') {
      const currentYear = new Date().getFullYear()
      dateFilter.selectedYear.value = availableYears.value.includes(currentYear)
        ? currentYear
        : availableYears.value[availableYears.value.length - 1]
    }
  }

  async function loadKpiData(range) {
    const res = await api(`/api/user/expenses/kpis?start=${range.start}&end=${range.end}`)
    kpiData.value = {
      totalExpenses: res?.totalExpenses ?? 0,
      totalCredits: res?.totalCredits ?? 0,
      netBalance: res?.netBalance ?? 0,
      monthlyAverage: res?.monthlyAverage ?? 0,
      recurringCount: res?.recurringCount ?? 0,
    }
  }

  async function loadOtherStats(range) {
    const res = await api(`/api/user/expenses/stats?start=${range.start}&end=${range.end}`)
    const operations = res?.data ?? []

    let totalExpensesValue = 0
    let totalCreditsValue = 0
    let expenseCount = 0
    let creditCount = 0
    const categoryCounts = new Map()

    for (const op of operations) {
      if (op.type === 'credit') {
        totalCreditsValue += op.amount
        creditCount += 1
      } else {
        totalExpensesValue += op.amount
        expenseCount += 1
      }

      if (op.category?.name) {
        categoryCounts.set(op.category.name, (categoryCounts.get(op.category.name) || 0) + 1)
      }
    }

    const topCategoryEntry = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]
    otherStats.value = {
      transactionCount: operations.length,
      totalExpenses: totalExpensesValue,
      totalCredits: totalCreditsValue,
      averageExpense: expenseCount > 0 ? totalExpensesValue / expenseCount : 0,
      averageCredit: creditCount > 0 ? totalCreditsValue / creditCount : 0,
      topCategory: topCategoryEntry ? topCategoryEntry[0] : 'Aucune',
    }
  }

  async function loadFilteredExpenses() {
    if (!dateFilter.dateRange.value) return

    isLoading.value = true
    try {
      const range = dateFilter.dateRange.value
      if (source.value === 'kpis') {
        await loadKpiData(range)
      } else {
        await loadOtherStats(range)
      }
    } finally {
      isLoading.value = false
    }
  }

  watch([
    () => dateFilter.dateRange.value,
    () => source.value,
  ], async () => {
    if (!dateFilter.dateRange.value) return
    await loadFilteredExpenses()
  })

  async function loadData() {
    isLoading.value = true
    try {
      await loadPeriods()
      await loadFilteredExpenses()
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    await loadData()
  })

  return {
    // État
    filteredExpenses,
    groupedExpenses,
    categories,
    isLoading,
    currency,

    // KPIs (calculés sur données filtrées)
    totalExpenses,
    totalCredits,
    netBalance,
    monthlyAverage,
    recurringCount,

    // Autres statistiques
    otherStats,
    source,

    // Options de sélection
    availableMonths,
    availableYears,
    groupingPeriodLabel,

    // Filtre de dates (pour accès dans les composants)
    dateFilter,
    activeFilterLabel,

    // Fonctions
    loadData,
    loadFilteredExpenses,
  }
}
