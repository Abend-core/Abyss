<template>
  <div class="expenses-list">
    <div v-if="isLoading" class="state-center">
      <BaseLoader size="lg" />
    </div>

    <template v-else-if="expenses.length === 0">
      <div class="empty-state">
        <BaseIcon name="chart" :size="48" color="var(--color-text-muted)" />
        <BaseText color="secondary">Aucune opération pour le moment.</BaseText>
        <BaseButton variant="primary" size="sm" @click="$emit('add-expense')">
          <BaseIcon name="plus" :size="14" />
          Ajouter ma première opération
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <button
        v-for="expense in expenses"
        :key="expense.id"
        class="expense-card"
        @click="$emit('select', expense)"
      >
        <div class="expense-card__main">
          <div>
            <BaseText weight="semibold">{{ expense.title }}</BaseText>
            <div class="expense-card__meta">
              <span>{{ formatDate(expense.date) }}</span>
            </div>
          </div>
          <div class="expense-card__amount" :style="{ color: getOperationColor(expense) }">
            {{ expense.type === 'credit' ? '+' : '-' }}{{ expense.amount.toFixed(2) }} {{ currency }}
          </div>
        </div>
        <div class="expense-card__tag-row">
          <span
            v-for="catTag in getCategoryLineage(expense.category)"
            :key="catTag.id"
            class="expense-card__tag expense-card__tag--category"
            :style="getCategoryTagStyle(catTag)"
          >
            {{ catTag.name }}
          </span>
          <span v-if="expense.isRecurring" class="expense-card__tag">
            ↻ {{ RECURRENCE_LABELS[expense.recurrence] ?? expense.recurrence }}
          </span>
          <span v-if="expense.description" class="expense-card__note">{{ expense.description }}</span>
        </div>
      </button>

      <div v-if="isLoadingMore" class="loading-more">
        <BaseLoader size="sm" />
        <BaseText size="xs" color="secondary">Chargement...</BaseText>
      </div>

      <div v-else-if="!hasMore && expenses.length > 0" class="history-note">
        <BaseText size="xs" color="secondary">
          Toutes les opérations sont affichées.
        </BaseText>
      </div>
    </template>
  </div>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseLoader from '@/components/atoms/BaseLoader.vue'
import BaseText from '@/components/atoms/BaseText.vue'

const RECURRENCE_LABELS = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  biweekly: 'Une semaine sur deux',
  monthly: 'Mensuelle',
  bimonthly: 'Un mois sur deux',
  yearly: 'Annuelle',
}

defineProps({
  expenses: { type: Array, required: true },
  currency: { type: String, required: true },
  isLoading: { type: Boolean, required: true },
  isLoadingMore: { type: Boolean, required: true },
  hasMore: { type: Boolean, required: true },
  formatDate: { type: Function, required: true },
  getOperationColor: { type: Function, required: true },
  getCategoryLineage: { type: Function, required: true },
  getCategoryTagStyle: { type: Function, required: true },
})

defineEmits(['select', 'add-expense'])
</script>

<style scoped>
/* ── Expense list ────────────────────────────────── */
.expenses-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 70vh;
  overflow-y: auto;
}

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

/* ── Expense card ────────────────────────────────── */
.expense-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  cursor: default;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}
.expense-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.expense-card__main {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
}

.expense-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.expense-card__amount {
  font-weight: var(--font-bold);
  color: var(--color-danger);
  white-space: nowrap;
}

.expense-card__tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}

.expense-card__tag {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.6rem;
  border: 1px solid transparent;
}

.expense-card__tag--category {
  border-width: 1px;
}

.expense-card__note {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-style: italic;
  margin-left: auto;
}

.history-note {
  padding-top: var(--space-3);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  color: var(--color-text-secondary);
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 640px) {
  .expenses-list {
    max-height: 60vh;
  }
}
</style>
