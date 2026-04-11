<template>
  <div class="stats-charts">
    <div v-show="shouldShowChart('chart-net-balance')" class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Évolution du solde net</BaseText>
      <div class="chart-wrapper">
        <canvas ref="chartNetBalanceRef"></canvas>
      </div>
    </div>

    <div v-show="shouldShowChart('chart-by-category')" class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Répartition par catégorie</BaseText>
      <div class="chart-wrapper">
        <canvas ref="chartByCategoryRef"></canvas>
      </div>
    </div>

    <div v-show="shouldShowChart('chart-evolution')" class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Évolution {{ groupingLabel }}</BaseText>
      <div class="chart-wrapper">
        <canvas ref="chartEvolutionRef"></canvas>
      </div>
    </div>

    <div v-show="shouldShowChart('chart-by-day-of-week')" class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Dépenses par jour de la semaine</BaseText>
      <div class="chart-wrapper">
        <canvas ref="chartByDayOfWeekRef"></canvas>
      </div>
    </div>

    <div v-show="shouldShowChart('chart-top-categories')" class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Top 5 catégories</BaseText>
      <div class="chart-wrapper">
        <canvas ref="chartTopCategoriesRef"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { Chart as ChartJS, registerables } from 'chart.js'
import BaseText from '@/components/atoms/BaseText.vue'
import { useAppStore } from '@/stores/app.store.js'
import { useApi } from '@/composables/useApi.js'

ChartJS.register(...registerables)

const props = defineProps({
  selectedChart: { type: String, default: null },
  dateRange: { type: Object, default: null }, // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
  groupingPeriod: { type: String, default: 'day' }, // 'day' | 'week' | 'month'
})

const shouldShowChart = (chartKey) => props.selectedChart === chartKey

const appStore = useAppStore()
const { api } = useApi()

// Refs pour les canvas
const chartNetBalanceRef = ref(null)
const chartByCategoryRef = ref(null)
const chartEvolutionRef = ref(null)
const chartByDayOfWeekRef = ref(null)
const chartTopCategoriesRef = ref(null)

// Instances de charts
const chartNetBalance = ref(null)
const chartByCategory = ref(null)
const chartEvolution = ref(null)
const chartByDayOfWeek = ref(null)
const chartTopCategories = ref(null)

// Computed
const groupingLabel = computed(() => {
  const labels = { day: 'par jour', week: 'par semaine', month: 'par mois' }
  return labels[props.groupingPeriod] || 'des données'
})

// Utils
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

function destroyChart(chartRef) {
  if (!chartRef.value || typeof chartRef.value.destroy !== 'function') return
  if (chartRef.value.canvas) chartRef.value.destroy()
  chartRef.value = null
}

// Build charts (each fetches from its dedicated API endpoint)
async function buildNetBalanceChart() {
  if (!chartNetBalanceRef.value || !props.dateRange) return
  const { start, end } = props.dateRange
  const res = await api(`/api/user/expenses/stats/net-balance?start=${start}&end=${end}`)
  const items = res?.data ?? []

  const data = {
    labels: items.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: 'Solde net',
      data: items.map(d => d.balance),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 6,
    }],
  }

  destroyChart(chartNetBalance)
  if (!chartNetBalanceRef.value) return
  chartNetBalance.value = new ChartJS(chartNetBalanceRef.value, {
    type: 'line', data, options: getChartOptions('line'),
  })
}

async function buildCategoryChart() {
  if (!chartByCategoryRef.value || !props.dateRange) return
  const { start, end } = props.dateRange
  const res = await api(`/api/user/expenses/stats/by-category?start=${start}&end=${end}`)
  const items = res?.data ?? []

  const data = {
    labels: items.map(d => d.categoryName),
    datasets: [{
      data: items.map(d => d.total),
      backgroundColor: items.map((d, i) => d.color || chartColorScheme.value.colors[i % chartColorScheme.value.colors.length]),
      borderColor: chartColorScheme.value.border,
      borderWidth: 1,
    }],
  }

  destroyChart(chartByCategory)
  if (!chartByCategoryRef.value) return
  chartByCategory.value = new ChartJS(chartByCategoryRef.value, {
    type: 'doughnut', data, options: getChartOptions('doughnut'),
  })
}

async function buildEvolutionChart() {
  if (!chartEvolutionRef.value || !props.dateRange) return
  const { start, end } = props.dateRange
  const res = await api(`/api/user/expenses/stats/timeline?start=${start}&end=${end}&period=${props.groupingPeriod}`)
  const items = res?.data ?? []

  const data = {
    labels: items.map(d => d.period),
    datasets: [
      {
        label: 'Dépenses',
        data: items.map(d => d.expenses),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3,
      },
      {
        label: 'Revenus',
        data: items.map(d => d.credits),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2, fill: true, tension: 0.3, pointRadius: 3,
      },
    ],
  }

  destroyChart(chartEvolution)
  if (!chartEvolutionRef.value) return
  chartEvolution.value = new ChartJS(chartEvolutionRef.value, {
    type: 'line', data, options: getChartOptions('line'),
  })
}

async function buildDayOfWeekChart() {
  if (!chartByDayOfWeekRef.value || !props.dateRange) return
  const { start, end } = props.dateRange
  const res = await api(`/api/user/expenses/stats?start=${start}&end=${end}`)
  const rawExpenses = res?.data ?? []

  const dayMap = new Map()
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  rawExpenses.forEach(e => {
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
    }],
  }

  destroyChart(chartByDayOfWeek)
  if (!chartByDayOfWeekRef.value) return
  chartByDayOfWeek.value = new ChartJS(chartByDayOfWeekRef.value, {
    type: 'bar', data, options: getChartOptions('bar'),
  })
}

async function buildTopCategoriesChart() {
  if (!chartTopCategoriesRef.value || !props.dateRange) return
  const { start, end } = props.dateRange
  const res = await api(`/api/user/expenses/stats/by-category?start=${start}&end=${end}`)
  const items = (res?.data ?? []).slice(0, 5)

  const data = {
    labels: items.map(d => d.categoryName),
    datasets: [{
      label: 'Total',
      data: items.map(d => d.total),
      backgroundColor: items.map((d, i) => d.color || chartColorScheme.value.colors[i % chartColorScheme.value.colors.length]),
      borderColor: chartColorScheme.value.border,
      borderWidth: 1,
    }],
  }

  destroyChart(chartTopCategories)
  if (!chartTopCategoriesRef.value) return
  chartTopCategories.value = new ChartJS(chartTopCategoriesRef.value, {
    type: 'bar', data, options: getChartOptions('bar'),
  })
}

async function buildCharts() {
  destroyChart(chartNetBalance)
  destroyChart(chartByCategory)
  destroyChart(chartEvolution)
  destroyChart(chartByDayOfWeek)
  destroyChart(chartTopCategories)

  if (!props.selectedChart || !props.dateRange) return

  if (props.selectedChart === 'chart-net-balance') {
    await buildNetBalanceChart()
  } else if (props.selectedChart === 'chart-by-category') {
    await buildCategoryChart()
  } else if (props.selectedChart === 'chart-evolution') {
    await buildEvolutionChart()
  } else if (props.selectedChart === 'chart-by-day-of-week') {
    await buildDayOfWeekChart()
  } else if (props.selectedChart === 'chart-top-categories') {
    await buildTopCategoriesChart()
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  await buildCharts()
})

onBeforeUnmount(() => {
  destroyChart(chartNetBalance)
  destroyChart(chartByCategory)
  destroyChart(chartEvolution)
  destroyChart(chartByDayOfWeek)
  destroyChart(chartTopCategories)
})

// Watchers
watch(() => appStore.isDark, () => buildCharts(), { flush: 'post' })
watch(
  () => [props.selectedChart, props.dateRange, props.groupingPeriod],
  async () => {
    await nextTick()
    await buildCharts()
  },
  { flush: 'post' }
)
</script>

<style scoped>
.stats-charts {
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

@media (max-width: 640px) {
  .stats-charts {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 250px;
  }
}
</style>
