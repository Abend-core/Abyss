<script setup>
import BaseText from '@/components/atoms/BaseText.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  expenseTitle: { type: String, default: '' },
  isDeleting: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Confirmer la suppression</BaseText>
          <button class="icon-btn" @click="$emit('close')" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <BaseText color="secondary">
            Êtes-vous sûr de vouloir supprimer l'opération "<strong>{{ expenseTitle }}</strong>" ? Cette action est irréversible.
          </BaseText>
        </div>
        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="$emit('close')">Annuler</BaseButton>
          <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="$emit('confirm')">
            <BaseIcon name="trash" :size="14" />
            Supprimer définitivement
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: min(100%, 440px);
  overflow: hidden;
}

.modal__header,
.modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
}

.modal__header {
  border-bottom: 1px solid var(--color-border);
}

.modal__body {
  padding: var(--space-4) var(--space-5);
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
}

.icon-btn:hover {
  color: var(--color-text-primary);
}

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
