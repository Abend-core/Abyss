<script setup>
import { useStatsPage } from '@/composables/useStatsPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import StatsKPIs from '@/components/pages/stats/StatsKPIs.vue'
import StatsCharts from '@/components/pages/stats/StatsCharts.vue'

const page = useStatsPage()
</script>

<template>
  <div class="stats-page">
    <div class="stats-page__header">
      <BaseText as="h1" size="2xl" weight="bold">Statistiques</BaseText>
      <BaseText as="p" color="secondary" size="sm">
        Visualisez l'évolution de vos opérations et gardez un œil sur les tendances.
      </BaseText>
    </div>

    <div v-if="page.isLoading" class="state-center">
      <BaseLoader size="lg" />
    </div>

    <template v-else>
      <!-- KPIs -->
      <StatsKPIs
        :net-balance="page.netBalance"
        :total-expenses="page.totalExpenses"
        :total-credits="page.totalCredits"
        :monthly-average="page.monthlyAverage"
        :recurring-count="page.recurringCount"
        :currency="page.currency"
      />

      <!-- Charts -->
      <StatsCharts />
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
</style>
