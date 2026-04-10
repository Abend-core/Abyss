<template>
  <div class="stats-charts">
    <div class="chart-container">
      <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Répartition par catégorie</BaseText>
      <div class="chart-wrapper">
        <canvas id="chartByCategory"></canvas>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-header">
        <BaseText as="h3" size="lg" weight="semibold" class="chart-title">Évolution mensuelle</BaseText>
        <div v-if="monthOptions.length" class="chart-select">
          <label>
            Mois
            <select :value="selectedMonth" @change="$emit('update:selectedMonth', $event.target.value)">
              <option v-for="option in monthOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
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

const props = defineProps({
  monthOptions: { type: Array, default: () => [] },
  selectedMonth: { type: String, default: '' },
})

const emit = defineEmits(['update:selectedMonth'])
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

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.chart-select label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.chart-select select {
  border: 1px solid var(--color-border);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-family: inherit;
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
