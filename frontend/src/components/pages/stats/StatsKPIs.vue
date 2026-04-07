<template>
  <div class="stats-kpis">
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
</template>

<script setup>
defineProps({
  netBalance: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  totalCredits: { type: Number, required: true },
  monthlyAverage: { type: Number, required: true },
  recurringCount: { type: Number, required: true },
  currency: { type: String, required: true },
})
</script>

<style scoped>
.stats-kpis {
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

@media (max-width: 640px) {
  .stats-kpis {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-3);
  }

  .kpi-card {
    padding: var(--space-3);
  }

  .kpi-card__value {
    font-size: var(--text-xl);
  }
}
</style>
