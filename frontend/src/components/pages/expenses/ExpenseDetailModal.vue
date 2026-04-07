<template>
  <Transition name="modal-fade">
    <div v-if="selected" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Détail de l'opération</BaseText>
          <button class="icon-btn" @click="$emit('close')" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div class="modal__amount">
            <span class="modal__amount-value" :style="{ color: getOperationColor(selected) }">
              {{ selected.type === 'credit' ? '+' : '-' }}{{ selected.amount.toFixed(2) }}
            </span>
            <span class="modal__amount-cur">{{ currency }}</span>
          </div>
          <dl class="modal__details">
            <div class="modal__row">
              <dt>Nom</dt>
              <dd>{{ selected.title }}</dd>
            </div>
            <div class="modal__row">
              <dt>Date</dt>
              <dd>{{ formatDate(selected.date) }}</dd>
            </div>
            <div class="modal__row">
              <dt>Type</dt>
              <dd>{{ selected.type === 'credit' ? 'Crédit' : 'Dépense' }}</dd>
            </div>
            <div v-if="selected.category" class="modal__row">
              <dt>Catégorie</dt>
              <dd>
                <span class="modal__cat-dot" :style="{ background: getCategoryColor(selected) }" />
                {{ getCategoryPath(selected.category) }}
              </dd>
            </div>
            <div v-if="selected.isRecurring" class="modal__row">
              <dt>Récurrence</dt>
              <dd>{{ RECURRENCE_LABELS[selected.recurrence] ?? selected.recurrence }}</dd>
            </div>
            <div v-if="selected.description" class="modal__row">
              <dt>Note</dt>
              <dd>{{ selected.description }}</dd>
            </div>
          </dl>
        </div>
        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="$emit('close')">Fermer</BaseButton>
          <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="$emit('delete', selected)">
            <BaseIcon name="trash" :size="14" />
            Supprimer
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
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
  selected: { type: Object, default: null },
  currency: { type: String, required: true },
  isDeleting: { type: Boolean, required: true },
  formatDate: { type: Function, required: true },
  getOperationColor: { type: Function, required: true },
  getCategoryColor: { type: Function, required: true },
  getCategoryPath: { type: Function, required: true },
})

defineEmits(['close', 'delete'])
</script>

<style scoped>
/* ── Icon button (close, etc.) ───────────────────── */
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.icon-btn:hover {
  color: var(--color-text-primary);
}

/* ── Modal ───────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 0;
}
@media (min-width: 640px) {
  .modal-overlay {
    align-items: center;
    padding: var(--space-4);
  }
}

.modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}
@media (min-width: 640px) {
  .modal {
    border-radius: var(--radius-xl);
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.modal__body {
  padding: var(--space-4) var(--space-5);
}

.modal__amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5) 0;
}
.modal__amount-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-danger);
}
.modal__amount-cur {
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
}

.modal__details {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.modal__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.modal__row:last-child {
  border-bottom: none;
}
.modal__row dt {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.modal__row dd {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-align: right;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.modal__cat-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal__footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* ── Transitions ─────────────────────────────────── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-fast);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal {
  transition: transform var(--transition-normal);
}
.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: translateY(24px);
}
</style>
