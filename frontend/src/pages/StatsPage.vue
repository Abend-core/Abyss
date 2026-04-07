<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Chart as ChartJS, registerables } from 'chart.js'
import { useApi } from '@/composables/useApi.js'
import { useAppStore } from '@/stores/app.store.js'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'

ChartJS.register(...registerables)

const { api } = useApi()
const appStore = useAppStore()

const expenses = ref([])
const categories = ref([])
const isLoading = ref(false)
const currency = ref('€')

// KPIs
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

// Data loading
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
      currency.value = { EUR:'€', USD:'$', GBP:'£', JPY:'¥', CHF:'CHF', AUD:'A$' }[cur] || cur
    }
  } finally {
    isLoading.value = false
  }
}

// Chart utils
const chartColorScheme = computed(() => {
  const isDark = appStore.isDark
  return {
    text: isDark ? '#d4d4d4' : '#333333',
    border: isDark ? '#3a3a3a' : '#e5e7eb',
    grid: isDark ? '#2d2d2d' : '#f3f4f6',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  }
})

function getChartOptions(type = 'line') {
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartColorScheme.value.text, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: chartColorScheme.value.border,
        borderWidth: 1,
        padding: 10,
      }
    }
  }
  
  if (type === 'doughnut' || type === 'pie') {
    opts.plugins.legend.position = 'bottom'
  } else {
    opts.scales = {
      x: { grid: { color: chartColorScheme.value.grid }, ticks: { color: chartColorScheme.value.text } },
      y: { grid: { color: chartColorScheme.value.grid }, ticks: { color: chartColorScheme.value.text }, beginAtZero: true }
    }
  }
  
  return opts
}

// Chart instances
const chartByCategory = ref(null)
const chartMonthlyEvolution = ref(null)
const chartByDayOfWeek = ref(null)
const chartTopCategories = ref(null)

// Build charts
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
    datasets: [{
      data: Array.from(categoryMap.values()),
      backgroundColor: colors,
      borderColor: chartColorScheme.value.border,
      borderWidth: 1,
    }]
  }
  
  const canvas = document.getElementById('chartByCategory')
  if (!canvas) return
  if (chartByCategory.value) chartByCategory.value.destroy()
  chartByCategory.value = new ChartJS(canvas, {
    type: 'doughnut',
    data,
    options: getChartOptions('doughnut')
  })
}

function buildMonthlyEvolutionChart() {
  const monthMap = new Map()
  expenses.value.forEach(e => {
    const month = new Date(e.date).toISOString().slice(0, 7)
    if (!monthMap.has(month)) monthMap.set(month, { expense: 0, credit: 0 })
    const m = monthMap.get(month)
    if (e.type === 'expense') m.expense += e.amount
    else m.credit += e.amount
  })
  
  const sortedMonths = Array.from(monthMap.keys()).sort()
  const expenseData = sortedMonths.map(m => monthMap.get(m).expense)
  const creditData = sortedMonths.map(m => monthMap.get(m).credit)
  
  const data = {
    labels: sortedMonths.map(m => {
      const [y, mo] = m.split('-')
      return `${mo}/${y.slice(2)}`
    }),
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
      }
    ]
  }
  
  const canvas = document.getElementById('chartMonthlyEvolution')
  if (!canvas) return
  if (chartMonthlyEvolution.value) chartMonthlyEvolution.value.destroy()
  chartMonthlyEvolution.value = new ChartJS(canvas, {
    type: 'line',
    data,
    options: getChartOptions('line')
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
    datasets: [{
      label: 'Dépenses',
      data: orderedDays.map(d => dayMap.get(d) || 0),
      backgroundColor: '#3b82f6',
      borderColor: chartColorScheme.value.border,
      borderWidth: 1,
    }]
  }
  
  const canvas = document.getElementById('chartByDayOfWeek')
  if (!canvas) return
  if (chartByDayOfWeek.value) chartByDayOfWeek.value.destroy()
  chartByDayOfWeek.value = new ChartJS(canvas, {
    type: 'bar',
    data,
    options: getChartOptions('bar')
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
    datasets: [{
      label: 'Total',
      data: sorted.map(([, amt]) => amt),
      backgroundColor: colors,
      borderColor: chartColorScheme.value.border,
      borderWidth: 1,
    }]
  }
  
  const canvas = document.getElementById('chartTopCategories')
  if (!canvas) return
  if (chartTopCategories.value) chartTopCategories.value.destroy()
  chartTopCategories.value = new ChartJS(canvas, {
    type: 'bar',
    data,
    options: getChartOptions('bar')
  })
}

// Watchers
watch(() => appStore.isDark, () => buildCharts(), { flush: 'post' })

onMounted(async () => {
  await loadData()
  buildCharts()
})
</script>

<template>
  <div class="stats-page">
    <div class="stats-page__header">
      <BaseText as="h1" size="2xl" weight="bold">Statistiques</BaseText>
      <BaseText as="p" color="secondary" size="sm">
        Visualisez l'évolution de vos opérations et gardez un œil sur les tendances.
      </BaseText>
    </div>

    <div v-if="isLoading" class="state-center">
      <BaseLoader size="lg" />
    </div>

    <template v-else>
      <!-- KPIs -->
      <div class="stats-page__kpis">
        <div class="kpi-card">
          <div class="kpi-card__label">Solde net</div>
          <div class="kpi-card__value" :style="{ color: netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }">
            {{ netBalance >= 0 ? '+' : '' }}{{ netBalance.toFixed(2) }}
          </div>
          <div class="kpi-card__unit">{{ currency }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__label">Total dépenses</div>
          <div class="kpi-card__value" style="color: var(--color-danger)">
            {{ totalExpenses.toFixed(2) }}
          </div>
          <div class="kpi-card__unit">{{ currency }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__label">Total revenus</div>
          <div class="kpi-card__value" style="color: var(--color-success)">
            {{ totalCredits.toFixed(2) }}
          </div>
          <div class="kpi-card__unit">{{ currency }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__label">Moyenne / mois</div>
          <div class="kpi-card__value">
            {{ monthlyAverage.toFixed(2) }}
          </div>
          <div class="kpi-card__unit">{{ currency }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__label">Opérations récurrentes</div>
          <div class="kpi-card__value">{{ recurringCount }}</div>
          <div class="kpi-card__unit">opérations</div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="stats-page__charts">
        <div class="chart-container">
          <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Répartition par catégorie</BaseText>
          <div class="chart-wrapper">
            <canvas id="chartByCategory"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Évolution mensuelle</BaseText>
          <div class="chart-wrapper">
            <canvas id="chartMonthlyEvolution"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Dépenses par jour de la semaine</BaseText>
          <div class="chart-wrapper">
            <canvas id="chartByDayOfWeek"></canvas>
          </div>
        </div>

        <div class="chart-container">
          <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Top 5 catégories</BaseText>
          <div class="chart-wrapper">
            <canvas id="chartTopCategories"></canvas>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-page {
  padding: var(--space-5) var(--content-padding);
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.stats-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.state-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* ── KPIs ─────────────────────────────────────── */
.stats-page__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}

.kpi-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: center;
}

.kpi-card__label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: var(--font-medium);
}

.kpi-card__value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.kpi-card__unit {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* ── Charts ───────────────────────────────────── */
.stats-page__charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-6);
}

.chart-container {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.chart-title {
  color: var(--color-text-primary);
  margin: 0;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

/* ── Responsive ───────────────────────────────── */
@media (max-width: 640px) {
  .stats-page {
    padding: var(--space-4) var(--content-padding);
    gap: var(--space-4);
  }

  .stats-page__kpis {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-3);
  }

  .kpi-card {
    padding: var(--space-3);
  }

  .kpi-card__value {
    font-size: var(--text-xl);
  }

  .stats-page__charts {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 250px;
  }
}
</style>
