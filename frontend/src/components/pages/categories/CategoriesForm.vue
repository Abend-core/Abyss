<template>
  <div class="categories-form">
    <div class="form-card">
      <div class="form-card__title">
        <BaseText weight="semibold">Nouvelle catégorie</BaseText>
      </div>
      <form @submit.prevent="$emit('add')" class="form-row">
        <BaseInput
          :model-value="newCategory"
          label="Nom"
          placeholder="ex: Alimentation"
          required
          @update:model-value="$emit('update:new-category', $event)"
        />
        <BaseButton type="submit" :disabled="!newCategory?.trim()">
          <BaseIcon name="plus" :size="14" />
          Ajouter
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseInput from '@/components/atoms/BaseInput.vue'
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  newCategory: { type: String, required: true },
})

defineEmits(['update:new-category', 'add'])
</script>

<style scoped>
.categories-form {
  margin-bottom: var(--space-5);
}

.form-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.form-card__title {
  margin-bottom: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
}

.form-row :deep(.form-group) {
  flex: 1;
}
</style>
