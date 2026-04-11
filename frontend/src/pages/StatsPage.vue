<script setup>
import { computed, ref, watch } from 'vue'
import { useStatsPage } from '@/composables/useStatsPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import StatsKPIs from '@/components/pages/stats/StatsKPIs.vue'
import StatsCharts from '@/components/pages/stats/StatsCharts.vue'
import DateRangePicker from '@/ui/components/common/DateRangePicker.vue'

const page = useStatsPage()
const dateFilter = page.dateFilter

// Computed properties to expose ref values
const isLoading = computed(() => page.isLoading.value)
const currency = computed(() => page.currency.value)
const totalExpenses = computed(() => page.totalExpenses.value)
const totalCredits = computed(() => page.totalCredits.value)
const netBalance = computed(() => page.netBalance.value)
const monthlyAverage = computed(() => page.monthlyAverage.value)
const recurringCount = computed(() => page.recurringCount.value)
const selectedChart = ref('kpis')
const isFilterOpen = ref(true)

const updateSelectedChart = (value) => {
  selectedChart.value = value
}

const chartLabels = {
  kpis: 'KPIs',
  'chart-net-balance': 'Évolution du solde net',
  'chart-by-category': 'Répartition par catégorie',
  'chart-evolution': 'Évolution des montants',
  'chart-by-day-of-week': 'Dépenses par jour de la semaine',
  'chart-top-categories': 'Top 5 catégories',
}

const selectedChartLabel = computed(() => chartLabels[selectedChart.value] || 'Graphique')
const isKpisView = computed(() => selectedChart.value === 'kpis')

watch(selectedChart, (value) => {
  page.source.value = value === 'kpis' ? 'kpis' : 'charts'
})

const customRange = computed({
  get() {
    if (!dateFilter.customStart.value) return ''
    if (!dateFilter.customEnd.value) return `${dateFilter.customStart.value}`
    return `${dateFilter.customStart.value}|${dateFilter.customEnd.value}`
  },
  set(value) {
    const normalized = value.trim().replace(/\s*(?:→|->|to)\s*/gi, '|')
    const partial = normalized.match(/^(\d{4}-\d{2}-\d{2})(?:\|)?$/)
    const full = normalized.match(/^(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})$/)

    if (full) {
      const [, start, end] = full
      dateFilter.customStart.value = start
      dateFilter.customEnd.value = end
      return
    }

    if (partial) {
      dateFilter.customStart.value = partial[1]
      dateFilter.customEnd.value = ''
      return
    }

    dateFilter.customStart.value = ''
    dateFilter.customEnd.value = ''
  },
})

const formatMonth = (month) => {
  return new Date(`${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="stats-page">
    <div class="stats-page__topbar">
      <div class="stats-page__view-selector">
        <label for="stats-view" class="view-selector__label">Afficher</label>
          <select id="stats-view" :value="selectedChart" @change="updateSelectedChart($event.target.value)" class="view-selector__select">
          <option value="kpis">KPIs</option>
          <option value="chart-net-balance">Évolution du solde net</option>
          <option value="chart-by-category">Répartition par catégorie</option>
          <option value="chart-evolution">Évolution des montants</option>
          <option value="chart-by-day-of-week">Dépenses par jour de la semaine</option>
          <option value="chart-top-categories">Top 5 catégories</option>
        </select>
      </div>
      <div class="stats-page__view-info">
        <p>Choisis une vue pour afficher les KPI ou un graphique individuel.</p>
      </div>
    </div>

    <section class="stats-page__filter-section" :class="{ 'collapsed': !isFilterOpen }">
      <header
        class="section-header section-header--space-between section-header--clickable"
        @click="isFilterOpen = !isFilterOpen"
        role="button"
        tabindex="0"
        :aria-expanded="isFilterOpen"
        @keydown.enter.prevent="isFilterOpen = !isFilterOpen"
      >
        <div class="filter-header">
          <div class="filter-header__title-row">
            <h2>Filtre</h2>
            <span class="toggle-indicator" aria-hidden="true">
              <span class="toggle-indicator__icon" :class="{ 'is-open': isFilterOpen }">▾</span>
            </span>
          </div>
          <p v-if="isFilterOpen">Applique un filtre par mois, année ou plage personnalisée.</p>
        </div>
      </header>
      <div class="stats-page__header" v-if="isFilterOpen">
        <div class="header-top">
          <div class="filter-inline">
            <label for="filter-mode" class="filter-inline__label">Type</label>
            <select id="filter-mode" v-model="dateFilter.filterMode.value" class="filter-inline__select">
              <option value="month">Mois</option>
              <option value="year">Année</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          <div class="filter-inline filter-inline--right">
            <template v-if="dateFilter.filterMode.value === 'month'">
              <label for="month-select" class="filter-inline__label">Mois</label>
              <select id="month-select" v-model="dateFilter.selectedMonth.value" class="filter-inline__select">
                <option :value="null" disabled>Choisir un mois...</option>
                <option v-for="month in page.availableMonths.value" :key="month" :value="month">
                  {{ formatMonth(month) }}
                </option>
              </select>
            </template>

            <template v-else-if="dateFilter.filterMode.value === 'year'">
              <label for="year-select" class="filter-inline__label">Année</label>
              <select id="year-select" v-model.number="dateFilter.selectedYear.value" class="filter-inline__select">
                <option :value="null" disabled>Choisir une année...</option>
                <option v-for="year in page.availableYears.value" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </template>

            <template v-else>
              <label for="custom-range" class="filter-inline__label">Date</label>
              <DateRangePicker
                id="custom-range"
                v-model="customRange"
                class="filter-inline__select"
              />
            </template>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-page__content-section">
      <header class="section-header">
        <h2>{{ selectedChartLabel }}</h2>
        <p>Les informations affichées ici dépendent de la sélection.</p>
      </header>
      <div v-if="isLoading" class="state-center">
        <BaseLoader size="lg" />
      </div>

      <template v-else>
        <StatsKPIs
          v-if="isKpisView"
          :net-balance="netBalance"
          :total-expenses="totalExpenses"
          :total-credits="totalCredits"
          :monthly-average="monthlyAverage"
          :recurring-count="recurringCount"
          :currency="currency"
        />

        <StatsCharts
          v-else
          :selected-chart="selectedChart"
          :date-range="page.dateFilter.dateRange.value"
          :grouping-period="page.dateFilter.groupingPeriod.value"
        />
      </template>
    </section>
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

/* Mobile - espace pour le bouton flottant */
@media (max-width: 767px) {
  .stats-page {
    padding-bottom: calc(var(--space-5) + 4.5rem);
  }
}

.stats-page__topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.stats-page__view-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 240px;
}

.view-selector__label {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.view-selector__select {
  min-width: 220px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-surface);
  color: var(--color-text);
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-text) 50%), linear-gradient(135deg, var(--color-text) 50%, transparent 50%);
  background-position: calc(100% - 1rem) center;
  background-size: 0.5rem 0.5rem;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}

.stats-page__view-info {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  max-width: 38rem;
  line-height: 1.6;
  text-align: left;
}

@media (max-width: 960px) {
  .stats-page__topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-page__view-info {
    max-width: 100%;
  }
}

.stats-page__filter-section,
.stats-page__content-section {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.stats-page__filter-section {
  padding-top: calc(var(--space-5) / 2);
  padding-bottom: calc(var(--space-5) * 1.5);
}

.stats-page__filter-section.collapsed {
  padding-bottom: 0;
}

.stats-page__filter-section.collapsed .stats-page__header,
.stats-page__filter-section.collapsed .active-filter-label {
  display: none;
}

.section-header--space-between {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.filter-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0;
  padding-top: 0;
  width: 100%;
}

.filter-header__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
}

.filter-header__title-row h2 {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}

.section-header--clickable {
  cursor: pointer;
}

.section-header--clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.toggle-indicator {
  margin-left: auto;
  min-width: 2.2rem;
  padding: 0.35rem 0.5rem;
  border-radius: 10px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.toggle-indicator__icon {
  display: inline-flex;
  transition: transform 0.2s ease;
}

.toggle-indicator__icon.is-open {
  transform: rotate(180deg);
}

.stats-page__filter-section.collapsed .section-header--space-between {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: var(--space-4);
}

.toggle-button {
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  color: var(--color-text);
  padding: 0.4rem 0.85rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: var(--font-medium);
  line-height: 1;
  min-height: auto;
}

.toggle-button:hover {
  border-color: var(--color-primary);
}

.section-header h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.section-header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.stats-page__header {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: start;
}

.stats-source-switch {
  display: flex;
  gap: var(--space-2);
}

.source-tab {
  border: 1px solid var(--color-border);
  background: var(--color-bg-surface);
  color: var(--color-text);
  padding: 0.75rem 1rem;
  border-radius: 999px;
  font-weight: var(--font-medium);
  cursor: pointer;
}

.source-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.active-filter-label {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.header-top {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.filter-inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}

.filter-inline--right {
  justify-content: flex-start;
}

  .filter-inline__label {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .filter-inline__select,
  .date-inline {
    min-width: 180px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-surface);
    color: var(--color-text);
  }

  .custom-date-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .date-inline-separator {
    color: var(--color-text-secondary);
  }

  .state-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

@media (max-width: 640px) {
  .header-top {
    flex-direction: column;
  }
}

</style>

