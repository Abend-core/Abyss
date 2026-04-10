import { ref, computed, watch, onMounted } from 'vue'
import { Chart as ChartJS, registerables } from 'chart.js'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'

ChartJS.register(...registerables)

export function useStatsPage() {
  const { api } = useApi()
  const appStore = useAppStore()

  // ── État ──────────────────────────────────────────
  const expenses = ref([])
  const categories = ref([])
  const isLoading = ref(false)
  const currency = ref('€')
  const selectedMonth = ref('')

  const availableMonths = computed(() => {
    const monthSet = new Set()
    expenses.value.forEach(e => {
      if (e.date) monthSet.add(e.date.slice(0, 7))
    })
    return Array.from(monthSet).sort()
  })

  const monthLabels = computed(() => {
    return availableMonths.value.map(month => {
      const [year, mo] = month.split('-')
      return `${new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01`))}`
    })
  })

  const monthOptions = computed(() => {
    return availableMonths.value.map((month, index) => ({ value: month, label: monthLabels.value[index] }))
  })

  watch(availableMonths, (months) => {
    if (!selectedMonth.value && months.length > 0) {
      selectedMonth.value = months[months.length - 1]
    }
    if (selectedMonth.value && !months.includes(selectedMonth.value)) {
      selectedMonth.value = months[months.length - 1] || ''
    }
  }, { immediate: true })

  function setSelectedMonth(month) {
    selectedMonth.value = month
  }

  // ── KPIs ──────────────────────────────────────────
  const totalExpenses = computed(() => {
    return expenses.value.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  })

  const totalCredits = computed(() => {
    return expenses.value.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0)
  })

  const netBalance = computed(() => totalCredits.value - totalExpenses.value)

  const monthlyAverage = computed(() => {
    if (expenses.value.length === 0) return 0
    const monthSet = new Set(expenses.value.map(e => new Date(e.date).toISOString().slice(0, 7)))
    return totalExpenses.value / (monthSet.size || 1)
  })

  const recurringCount = computed(() => {
    return expenses.value.filter(e => e.isRecurring).length
  })

  // ── Data loading ──────────────────────────────────
  async function loadData() {
    isLoading.value = true
    try {
      const [expensesRes, catsRes, userRes] = await Promise.allSettled([
        api('/api/user/expenses'),
        api('/api/categories'),
        api('/api/user'),
      ])

      if (expensesRes.status === 'fulfilled') {
        const res = expensesRes.value
        expenses.value = res?.data ?? res ?? []
      }
      if (catsRes.status === 'fulfilled') categories.value = catsRes.value ?? []
      if (userRes.status === 'fulfilled') {
        const cur = userRes.value.settings?.currency || 'EUR'
        currency.value = { EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF', AUD: 'A$' }[cur] || cur
      }
    } finally {
      isLoading.value = false
    }
  }

  // ── Chart utils ───────────────────────────────────
  const chartColorScheme = computed(() => {
    const isDark = appStore.isDark
    return {
      text: isDark ? '#d4d4d4' : '#333333',
      border: isDark ? '#3a3a3a' : '#e5e7eb',
      grid: isDark ? '#2d2d2d' : '#f3f4f6',
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
    }
  })

  function getChartOptions(type = 'line') {
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: chartColorScheme.value.text, font: { size: 12 } },
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: chartColorScheme.value.border,
          borderWidth: 1,
          padding: 10,
        },
      },
    }

    if (type === 'doughnut' || type === 'pie') {
      opts.plugins.legend.position = 'bottom'
    } else {
      opts.scales = {
        x: { grid: { color: chartColorScheme.value.grid }, ticks: { color: chartColorScheme.value.text } },
        y: {
          grid: { color: chartColorScheme.value.grid },
          ticks: { color: chartColorScheme.value.text },
          beginAtZero: true,
        },
      }
    }

    return opts
  }

  // ── Chart instances ───────────────────────────────
  const chartByCategory = ref(null)
  const chartMonthlyEvolution = ref(null)
  const chartByDayOfWeek = ref(null)
  const chartTopCategories = ref(null)

  // ── Build charts ──────────────────────────────────
  function buildCharts() {
    buildCategoryChart()
    buildMonthlyEvolutionChart()
    buildDayOfWeekChart()
    buildTopCategoriesChart()
  }

  function buildCategoryChart() {
    const categoryMap = new Map()
    const categoryColors = new Map()

    expenses.value.forEach(e => {
      if (e.type === 'expense' && e.category) {
        const name = e.category.name
        categoryMap.set(name, (categoryMap.get(name) || 0) + e.amount)
        if (!categoryColors.has(name) && e.category.color) {
          categoryColors.set(name, e.category.color)
        }
      }
    })

    const labels = Array.from(categoryMap.keys())
    const colors = labels.map(label => categoryColors.get(label) || chartColorScheme.value.colors[labels.indexOf(label)])

    const data = {
      labels,
      datasets: [
        {
          data: Array.from(categoryMap.values()),
          backgroundColor: colors,
          borderColor: chartColorScheme.value.border,
          borderWidth: 1,
        },
      ],
    }

    const canvas = document.getElementById('chartByCategory')
    if (!canvas) return
    if (chartByCategory.value) chartByCategory.value.destroy()
    chartByCategory.value = new ChartJS(canvas, {
      type: 'doughnut',
      data,
      options: getChartOptions('doughnut'),
    })
  }

  function buildMonthlyEvolutionChart() {
    const selected = selectedMonth.value || availableMonths.value[availableMonths.value.length - 1]
    if (!selected) return

    const startDate = new Date(`${selected}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    const daysInMonth = endDate.getDate()

    const dayMap = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      expense: 0,
      credit: 0,
    }))

    expenses.value.forEach(e => {
      const expenseMonth = e.date.slice(0, 7)
      if (expenseMonth !== selected) return
      const day = new Date(e.date).getDate()
      if (!dayMap[day - 1]) return
      if (e.type === 'expense') {
        dayMap[day - 1].expense += e.amount
      } else {
        dayMap[day - 1].credit += e.amount
      }
    })

    const labels = dayMap.map(item => item.day.toString())
    const expenseData = dayMap.map(item => item.expense)
    const creditData = dayMap.map(item => item.credit)

    const data = {
      labels,
      datasets: [
        {
          label: 'Dépenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Revenus',
          data: creditData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    }

    const canvas = document.getElementById('chartMonthlyEvolution')
    if (!canvas) return
    if (chartMonthlyEvolution.value) chartMonthlyEvolution.value.destroy()
    chartMonthlyEvolution.value = new ChartJS(canvas, {
      type: 'line',
      data,
      options: getChartOptions('line'),
    })
  }

  function buildDayOfWeekChart() {
    const dayMap = new Map()
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

    expenses.value.forEach(e => {
      if (e.type === 'expense') {
        const dow = new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long' })
        const dayName = days.find(d => d.toLowerCase() === dow.toLowerCase()) || dow
        dayMap.set(dayName, (dayMap.get(dayName) || 0) + e.amount)
      }
    })

    const orderedDays = days.filter(d => dayMap.has(d))
    const data = {
      labels: orderedDays,
      datasets: [
        {
          label: 'Dépenses',
          data: orderedDays.map(d => dayMap.get(d) || 0),
          backgroundColor: '#3b82f6',
          borderColor: chartColorScheme.value.border,
          borderWidth: 1,
        },
      ],
    }

    const canvas = document.getElementById('chartByDayOfWeek')
    if (!canvas) return
    if (chartByDayOfWeek.value) chartByDayOfWeek.value.destroy()
    chartByDayOfWeek.value = new ChartJS(canvas, {
      type: 'bar',
      data,
      options: getChartOptions('bar'),
    })
  }

  function buildTopCategoriesChart() {
    const categoryMap = new Map()
    const categoryColors = new Map()

    expenses.value.forEach(e => {
      if (e.type === 'expense' && e.category) {
        const name = e.category.name
        categoryMap.set(name, (categoryMap.get(name) || 0) + e.amount)
        if (!categoryColors.has(name) && e.category.color) {
          categoryColors.set(name, e.category.color)
        }
      }
    })

    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const labels = sorted.map(([name]) => name)
    const colors = labels.map(label => categoryColors.get(label) || chartColorScheme.value.colors[labels.indexOf(label)])

    const data = {
      labels,
      datasets: [
        {
          label: 'Total',
          data: sorted.map(([, amt]) => amt),
          backgroundColor: colors,
          borderColor: chartColorScheme.value.border,
          borderWidth: 1,
        },
      ],
    }

    const canvas = document.getElementById('chartTopCategories')
    if (!canvas) return
    if (chartTopCategories.value) chartTopCategories.value.destroy()
    chartTopCategories.value = new ChartJS(canvas, {
      type: 'bar',
      data,
      options: getChartOptions('bar'),
    })
  }

  // ── Watchers ──────────────────────────────────────
  watch(() => appStore.isDark, () => buildCharts(), { flush: 'post' })
  watch(expenses, () => buildCharts(), { flush: 'post' })
  watch(selectedMonth, () => {
    buildMonthlyEvolutionChart()
  }, { flush: 'post' })

  onMounted(async () => {
    await loadData()
    await nextTick()
    buildCharts()
  })

  return {
    // État
    expenses,
    categories,
    isLoading,
    currency,

    // KPIs
    totalExpenses,
    totalCredits,
    netBalance,
    monthlyAverage,
    recurringCount,

    // Mois disponibles
    availableMonths,
    monthOptions,
    selectedMonth,
    setSelectedMonth,

    // Fonctions
    loadData,
    buildCharts,
  }
}
