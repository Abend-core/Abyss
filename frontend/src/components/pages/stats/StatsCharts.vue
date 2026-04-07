<template>
  <div class="stats-charts">
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

<script setup>
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  // Les charts sont générés par la composable via onMounted
})
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
