<template>
  <Transition name="modal-fade">
    <div v-if="selected" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Détail de l'opération</BaseText>
          <button class="icon-btn" @click="handleClose" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>
        <div class="modal__body">
          <div class="modal__amount">
            <span class="modal__amount-value" :style="{ color: getOperationColor(editForm) }">
              {{ editForm.type === 'credit' ? '+' : '-' }}{{ Number(editForm.amount).toFixed(2) }}
            </span>
            <span class="modal__amount-cur">{{ currency }}</span>
          </div>
          <dl class="modal__details">
            <div class="modal__row">
              <dt>Nom</dt>
              <dd v-if="!isEditing">{{ selected.title }}</dd>
              <dd v-else>
                <BaseInput
                  :model-value="editForm.title"
                  @update:model-value="value => editForm.title = value"
                  placeholder="Titre de l'opération"
                />
              </dd>
            </div>
            <div class="modal__row">
              <dt>Date</dt>
              <dd v-if="!isEditing">{{ formatDate(selected.date) }}</dd>
              <dd v-else>
                <BaseInput
                  :model-value="editForm.date"
                  type="date"
                  @update:model-value="value => editForm.date = value"
                />
              </dd>
            </div>
            <div class="modal__row">
              <dt>Type</dt>
              <dd v-if="!isEditing">{{ selected.type === 'credit' ? 'Crédit' : 'Dépense' }}</dd>
              <dd v-else>
                <select v-model="editForm.type" class="form-select" required>
                  <option value="expense">Dépense</option>
                  <option value="credit">Crédit</option>
                </select>
              </dd>
            </div>
            <div class="modal__row">
              <dt>Catégorie</dt>
              <dd v-if="!isEditing">{{ getCategoryPath(selected.category) }}</dd>
              <dd v-else>
                <select v-model="editForm.categoryId" class="form-select">
                  <option value="">Sans catégorie</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </dd>
            </div>
            <div class="modal__row">
              <dt>Description</dt>
              <dd v-if="!isEditing">{{ selected.description || '-' }}</dd>
              <dd v-else>
                <BaseInput
                  :model-value="editForm.description"
                  @update:model-value="value => editForm.description = value"
                  placeholder="Notes supplémentaires"
                />
              </dd>
            </div>
          </dl>
        </div>
        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="handleClose">
            {{ isEditing ? 'Annuler' : 'Fermer' }}
          </BaseButton>
          <BaseButton
            v-if="!isEditing"
            variant="danger"
            size="sm"
            :loading="props.isDeleting"
            @click="$emit('delete', selected)"
          >
            <BaseIcon name="trash" :size="14" />
            Supprimer
          </BaseButton>
          <BaseButton
            v-if="!isEditing"
            variant="secondary"
            size="sm"
            @click="startEdit"
          >
            <BaseIcon name="edit" :size="14" />
            Modifier
          </BaseButton>
          <BaseButton
            v-else
            variant="primary"
            size="sm"
            :disabled="isSaveDisabled"
            @click="saveChanges"
          >
            <BaseIcon name="check" :size="14" />
            Enregistrer
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseText from '@/components/atoms/BaseText.vue'

const RECURRENCE_LABELS = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  biweekly: 'Une semaine sur deux',
  monthly: 'Mensuelle',
  bimonthly: 'Un mois sur deux',
  yearly: 'Annuelle',
}

const props = defineProps({
  selected: { type: Object, default: null },
  currency: { type: String, required: true },
  formatDate: { type: Function, required: true },
  getOperationColor: { type: Function, required: true },
  getCategoryColor: { type: Function, required: true },
  getCategoryPath: { type: Function, required: true },
  categories: { type: Array, default: () => [] },
  isDeleting: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save', 'delete'])

const isEditing = ref(false)
const editForm = reactive({
  title: '',
  amount: 0,
  date: '',
  type: 'expense',
  categoryId: '',
  description: '',
})

watch(() => props.selected, (expense) => {
  isEditing.value = false
  if (expense) {
    editForm.title = expense.title
    editForm.amount = expense.amount
    editForm.date = expense.date
    editForm.type = expense.type || 'expense'
    editForm.categoryId = expense.category?.id || ''
    editForm.description = expense.description || ''
  }
}, { immediate: true })

function startEdit() {
  isEditing.value = true
}

function resetEditForm() {
  if (!props.selected) return
  editForm.title = props.selected.title
  editForm.amount = props.selected.amount
  editForm.date = props.selected.date
  editForm.type = props.selected.type || 'expense'
  editForm.categoryId = props.selected.category?.id || ''
  editForm.description = props.selected.description || ''
}

function handleClose() {
  if (isEditing.value) {
    resetEditForm()
    isEditing.value = false
    return
  }
  emit('close')
}

function saveChanges() {
  emit('save', {
    id: props.selected.id,
    title: editForm.title,
    amount: Number(editForm.amount),
    date: editForm.date,
    type: editForm.type,
    categoryId: editForm.categoryId || undefined,
    description: editForm.description,
  })
}

const isSaveDisabled = computed(() => !editForm.title?.trim() || Number.isNaN(Number(editForm.amount)) || Number(editForm.amount) <= 0)
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
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}
@media (min-width: 640px) {
  .modal-overlay {
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
