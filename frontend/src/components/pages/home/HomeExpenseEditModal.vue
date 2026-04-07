<script setup>
import { reactive, watch } from 'vue'
import BaseText from '@/components/atoms/BaseText.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseStepper from '@/components/atoms/BaseStepper.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  editForm: { type: Object, default: () => ({}) },
  categories: { type: Array, default: () => [] },
  isSubmitting: { type: Boolean, default: false },
  isDeleting: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show', 'update:editForm', 'close', 'save', 'delete'])

const localForm = reactive({
  title: props.editForm.title ?? '',
  amount: props.editForm.amount ?? '',
  date: props.editForm.date ?? new Date().toISOString().split('T')[0],
  type: props.editForm.type ?? 'expense',
  categoryId: props.editForm.categoryId ?? '',
  isRecurring: props.editForm.isRecurring ?? false,
  recurrence: props.editForm.recurrence ?? '',
})

watch(
  () => props.editForm,
  newForm => {
    Object.assign(localForm, {
      title: newForm.title ?? '',
      amount: newForm.amount ?? '',
      date: newForm.date ?? new Date().toISOString().split('T')[0],
      type: newForm.type ?? 'expense',
      categoryId: newForm.categoryId ?? '',
      isRecurring: newForm.isRecurring ?? false,
      recurrence: newForm.recurrence ?? '',
    })
  },
  { deep: true, immediate: true }
)

watch(
  localForm,
  newForm => emit('update:editForm', { ...newForm }),
  { deep: true }
)
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__header">
          <BaseText weight="semibold" size="lg">Modifier l'opération</BaseText>
          <button class="icon-btn" @click="$emit('close')" type="button">
            <BaseIcon name="close" :size="20" />
          </button>
        </div>

        <form @submit.prevent="$emit('save')" class="modal__body">
          <div class="form-grid">
            <BaseInput v-model="localForm.title" label="Nom" placeholder="Ex: Courses supermarché" required />
            <BaseStepper
              v-model="localForm.amount"
              label="Montant"
              required
              placeholder="0,00"
              :hint="`Montant minimal 0,01`"
              :min="0.01"
              :max="1000000"
              :step="1"
            />
            <div class="form-group">
              <label class="form-label">Type</label>
              <select v-model="localForm.type" class="form-select" required>
                <option value="expense">Dépense</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
            <BaseInput v-model="localForm.date" label="Date" type="date" required />
            <div class="form-group form-col-span">
              <label class="form-label">Catégorie</label>
              <select v-model="localForm.categoryId" class="form-select">
                <option value="">Sans catégorie</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-row form-col-span">
              <label class="checkbox-label">
                <input v-model="localForm.isRecurring" type="checkbox" />
                <span>Permanente</span>
              </label>
              <div v-if="localForm.isRecurring" class="form-group">
                <select v-model="localForm.recurrence" class="form-select" required>
                  <option value="">Choisir un rythme</option>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="biweekly">Une semaine sur deux</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="bimonthly">Un mois sur deux</option>
                  <option value="yearly">Annuelle</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        <div class="modal__footer">
          <BaseButton variant="ghost" size="sm" @click="$emit('close')">Annuler</BaseButton>
          <BaseButton variant="danger" size="sm" :loading="isDeleting" @click="$emit('delete')">
            <BaseIcon name="trash" :size="14" />
            Supprimer
          </BaseButton>
          <BaseButton variant="primary" size="sm" :loading="isSubmitting" @click="$emit('save')">
            <BaseIcon name="check" :size="14" />
            Enregistrer
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
