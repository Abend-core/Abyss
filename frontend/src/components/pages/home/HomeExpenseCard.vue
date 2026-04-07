<script setup>
import BaseText from '@/components/atoms/BaseText.vue'

const props = defineProps({
  expense: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  currency: { type: String, default: '€' },
})
const emit = defineEmits(['select'])

function getCategoryLineage(category) {
  if (!category) return []
  const parent = props.categories.find(c => c.id === category.parentId)
  return parent ? [parent, category] : [category]
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getOperationColor(expense) {
  return expense.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
}
</script>

<template>
  <button type="button" class="expense-card" @click="$emit('select', expense)">
    <div class="expense-card__main">
      <div>
        <BaseText weight="semibold">{{ expense.title }}</BaseText>
        <div class="expense-card__meta">
          <span>{{ formatDate(expense.date) }}</span>
        </div>
      </div>
      <div class="expense-card__amount" :style="{ color: getOperationColor(expense) }">
        {{ expense.type === 'credit' ? '+' : '-' }}{{ Number(expense.amount).toFixed(2) }} {{ currency }}
      </div>
    </div>

    <div class="expense-card__tag-row">
      <span
        v-for="catTag in getCategoryLineage(expense.category)"
        :key="catTag.id"
        class="expense-card__tag expense-card__tag--category"
        :style="{ backgroundColor: catTag.color ? `${catTag.color}20` : undefined, borderColor: catTag.color || undefined, color: catTag.color || undefined }"
      >
        {{ catTag.name }}
      </span>
      <span v-if="expense.isRecurring" class="expense-card__tag">↻ {{ expense.recurrenceLabel }}</span>
      <span v-if="expense.description" class="expense-card__note">{{ expense.description }}</span>
    </div>
  </button>
</template>
