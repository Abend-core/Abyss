<template>
  <div class="settings-section">
    <div class="settings-card danger">
      <div class="setting-row danger-row">
        <div>
          <BaseText weight="semibold">Supprimer mon compte</BaseText>
          <BaseText size="sm" color="secondary">Cette action est irréversible et supprimera toutes vos données</BaseText>
        </div>
        <BaseButton variant="danger" size="sm" @click="$emit('delete')">
          <BaseIcon name="trash" :size="14" />
          Supprimer
        </BaseButton>
      </div>
    </div>
  </div>

  <!-- Delete confirmation modal -->
  <Transition name="modal-fade">
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal danger-modal" role="dialog" aria-modal="true">
        <div class="modal__header danger-header">
          <BaseIcon name="alert-triangle" :size="24" color="var(--color-danger)" />
          <BaseText weight="semibold" size="lg">Supprimer mon compte</BaseText>
          <button class="icon-btn" @click="$emit('close')" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <BaseText color="secondary">
            Cette action est <strong>irréversible</strong>. Tous vos données seront supprimées définitivement.
            Êtes-vous absolument sûr ?
          </BaseText>
        </div>
        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="$emit('close')">Annuler</BaseButton>
          <BaseButton variant="danger" size="sm" @click="$emit('confirm-delete')">Supprimer</BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  showDeleteModal: { type: Boolean, required: true },
})

defineEmits(['delete', 'close', 'confirm-delete'])
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-3);
}

.settings-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.settings-card.danger {
  border-color: var(--color-danger);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.setting-row > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-row.danger-row {
  border-color: var(--color-danger);
}

.setting-row:last-child {
  border-bottom: none;
}

/* Mobile - empilement vertical */
@media (max-width: 640px) {
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}

/* ── Modal ────────────────────────────────────────── */
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.danger-modal {
  border-color: var(--color-danger);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.danger-header {
  border-color: var(--color-danger);
}

.modal__body {
  padding: var(--space-4) var(--space-5);
}

.modal__footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* ── Transitions ──────────────────────────────────── */
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
  transform: scale(0.95);
}
</style>
