<script setup>
import { computed } from 'vue'
import { useStatsPage } from '@/composables/useStatsPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import StatsKPIs from '@/components/pages/stats/StatsKPIs.vue'
import StatsCharts from '@/components/pages/stats/StatsCharts.vue'

const page = useStatsPage()

// Computed properties to expose ref values
const isLoading = computed(() => page.isLoading.value)
const currency = computed(() => page.currency.value)
const selectedMonth = computed(() => page.selectedMonth.value)
const monthOptions = computed(() => page.monthOptions.value)
const totalExpenses = computed(() => page.expenses.value.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0))
const totalCredits = computed(() => page.expenses.value.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0))
const netBalance = computed(() => totalCredits.value - totalExpenses.value)
const monthlyAverage = computed(() => {
  if (page.expenses.value.length === 0) return 0
  const monthSet = new Set(page.expenses.value.map(e => new Date(e.date).toISOString().slice(0, 7)))
  return totalExpenses.value / (monthSet.size || 1)
})
const recurringCount = computed(() => page.expenses.value.filter(e => e.isRecurring).length)
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
      <StatsKPIs
        :net-balance="netBalance"
        :total-expenses="totalExpenses"
        :total-credits="totalCredits"
        :monthly-average="monthlyAverage"
        :recurring-count="recurringCount"
        :currency="currency"
      />

      <!-- Charts -->
      <StatsCharts
        :month-options="monthOptions"
        :selected-month="selectedMonth"
        @update:selectedMonth="page.setSelectedMonth($event)"
      />
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

/* Mobile - espace pour le bouton flottant */
@media (max-width: 767px) {
  .stats-page {
    padding-bottom: calc(var(--space-5) + 4.5rem);
  }
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
</style>
