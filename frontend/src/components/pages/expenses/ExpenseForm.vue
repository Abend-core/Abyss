<template>
  <Transition name="slide-down">
    <div v-if="showForm" class="form-card">
      <div class="form-card__title">
        <BaseText weight="semibold">{{ isEditing ? 'Modifier l\'opération' : 'Nouvelle opération' }}</BaseText>
      </div>
      <form @submit.prevent="$emit('submit')" class="form-grid">
        <BaseInput
          :model-value="form.title"
          label="Nom"
          placeholder="Ex: Courses supermarché"
          required
          class="form-col-span"
          @update:model-value="$emit('update:form', { ...form, title: $event })"
        />
        <div class="form-group">
          <label class="form-label">
            Montant
            <span class="form-label-required">*</span>
          </label>
          <BaseStepper
            :model-value="form.amount"
            required
            placeholder="0,00"
            :hint="`Montant minimal 1`"
            :min="1"
            :max="1000000"
            :step="1"
            @update:model-value="handleAmountUpdate($event)"
          />
        </div>
        <BaseInput
          :model-value="form.date"
          label="Date"
          type="date"
          required
          @update:model-value="$emit('update:form', { ...form, date: $event })"
        />
        <div class="form-group">
          <label class="form-label">Type</label>
          <select
            :value="form.type"
            class="form-select"
            required
            @change="$emit('update:form', { ...form, type: $event.target.value })"
          >
            <option value="expense">Dépense</option>
            <option value="credit">Crédit</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Catégorie</label>
          <select
            :value="form.categoryId"
            class="form-select"
            @change="$emit('update:form', { ...form, categoryId: $event.target.value })"
          >
            <option value="">Sans catégorie</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <BaseInput
          :model-value="form.description"
          label="Description (optionnelle)"
          placeholder="Notes supplémentaires"
          class="form-col-span"
          @update:model-value="$emit('update:form', { ...form, description: $event })"
        />
        <div class="form-row form-col-span">
          <label class="checkbox-label">
            <input
              :checked="form.isRecurring"
              type="checkbox"
              @change="$emit('update:form', { ...form, isRecurring: $event.target.checked })"
            />
            <span>Permanente</span>
          </label>
          <div v-if="form.isRecurring" class="form-group-inline">
            <label class="form-label">Rythme</label>
            <select
              :value="form.recurrence"
              class="form-select"
              required
              @change="$emit('update:form', { ...form, recurrence: $event.target.value })"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Une semaine sur deux</option>
              <option value="monthly">Mensuelle</option>
              <option value="bimonthly">Un mois sur deux</option>
              <option value="yearly">Annuelle</option>
            </select>
          </div>
        </div>
        <BaseButton
          type="submit"
          class="form-col-span"
          :full="true"
          :loading="isSubmitting"
          :disabled="isSubmitDisabled"
        >
          {{ isEditing ? 'Modifier l\'opération' : 'Ajouter l\'opération' }}
        </BaseButton>
      </form>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseStepper from '@/components/atoms/BaseStepper.vue'
import BaseText from '@/components/atoms/BaseText.vue'

const props = defineProps({
  showForm: { type: Boolean, required: true },
  form: { type: Object, required: true },
  categories: { type: Array, required: true },
  isSubmitting: { type: Boolean, required: true },
  isEditing: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'update:form'])

const isSubmitDisabled = computed(() => {
  const amount = String(props.form.amount || '').replace(',', '.')
  const value = parseFloat(amount)
  const hasValidTitle = props.form.title?.trim().length > 0
  const hasValidAmount = !Number.isNaN(value) && value > 0

  return !hasValidTitle || !hasValidAmount
})

function handleAmountUpdate(newAmount) {
  emit('update:form', { ...props.form, amount: newAmount })
}
</script>

<style scoped>
/* ── Form card ───────────────────────────────────── */
.form-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.form-card__title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.form-col-span {
  grid-column: 1 / -1;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.form-group-inline {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-left: var(--space-4);
}
.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}
.form-label-required {
  color: var(--color-danger);
  margin-left: var(--space-1);
}
.form-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  cursor: pointer;
}

.form-select {
  width: 100%;
  min-height: 2.5rem;
  padding: 0 var(--space-3);
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-2) center;
  background-repeat: no-repeat;
  background-size: 1.5em;
  transition: border-color var(--transition-fast);
}
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Transitions ─────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-normal);
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 1200px;
}
</style>
