<template>
  <div class="settings-section">
    <BaseText as="h3" size="lg" weight="semibold" class="section-title">Devise</BaseText>
    <div class="settings-card">
      <div class="setting-row">
        <div>
          <BaseText weight="semibold">Devise de base</BaseText>
          <BaseText size="sm" color="secondary">Sélectionnez votre devise par défaut</BaseText>
        </div>
        <select v-model="currency" class="form-select" @change="$emit('save')">
          <option v-for="opt in currencyOptions" :key="opt.code" :value="opt.code">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  currency: { type: String, required: true },
  currencyOptions: { type: Array, required: true },
})

defineEmits(['update:currency', 'save'])
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

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.setting-row:last-child {
  border-bottom: none;
}

.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  min-width: 150px;
}
</style>
