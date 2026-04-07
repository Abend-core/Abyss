<template>
  <Transition name="modal-fade">
    <div v-if="editingCategory" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Éditer la catégorie</BaseText>
          <button class="icon-btn" @click="$emit('close')" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>
        <form @submit.prevent="$emit('save')" class="modal__body">
          <BaseInput
            :model-value="editForm.name"
            label="Nom"
            placeholder="ex: Alimentation"
            required
            @update:model-value="$emit('update:editForm', { ...editForm, name: $event })"
          />
          <div class="form-group">
            <label class="form-label">Couleur</label>
            <input
              type="color"
              :value="editForm.color || '#f59e0b'"
              class="color-input"
              @input="$emit('update:editForm', { ...editForm, color: $event.target.value })"
            />
          </div>
        </form>
        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="$emit('close')">Annuler</BaseButton>
          <BaseButton variant="primary" size="sm" @click="$emit('save')" :disabled="!editForm.name.trim()">
            Enregistrer
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  editingCategory: { type: Object, default: null },
  editForm: { type: Object, required: true },
})

defineEmits(['close', 'update:editForm', 'save'])
</script>

<style scoped>
/* ── Icon button ──────────────────────────────────── */
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

/* ── Modal ────────────────────────────────────────── */
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

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.modal__body {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modal__footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.color-input {
  height: 3rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
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
