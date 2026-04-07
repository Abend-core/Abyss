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
