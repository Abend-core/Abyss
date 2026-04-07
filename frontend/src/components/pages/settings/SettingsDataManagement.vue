<template>
  <div class="settings-section">
    <BaseText as="h3" size="lg" weight="semibold" class="section-title">Données</BaseText>
    <div class="settings-card">
      <div class="setting-row">
        <div>
          <BaseText weight="semibold">Exporter vos données</BaseText>
          <BaseText size="sm" color="secondary">Téléchargez une copie de vos données au format JSON</BaseText>
        </div>
        <BaseButton variant="secondary" size="sm" @click="$emit('export')">
          <BaseIcon name="download" :size="14" />
          Exporter
        </BaseButton>
      </div>

      <div class="setting-row">
        <div>
          <BaseText weight="semibold">Importer vos données</BaseText>
          <BaseText size="sm" color="secondary">Restaurez vos données à partir d'un fichier JSON</BaseText>
        </div>
        <BaseButton v-if="!selectedFileName" variant="secondary" size="sm" @click="$emit('select-import')">
          <BaseIcon name="upload" :size="14" />
          Importer
        </BaseButton>
        <BaseButton v-else variant="success" size="sm" @click="$emit('confirm-import')">
          <BaseIcon name="check" :size="14" />
          Confirmer
        </BaseButton>
      </div>

      <div v-if="selectedFileName" class="setting-row">
        <div>
          <BaseText size="sm">Fichier : {{ selectedFileName }}</BaseText>
        </div>
        <BaseButton variant="ghost" size="sm" @click="$emit('cancel-import')">Annuler</BaseButton>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden-file-input"
      @change="$emit('handle-file-change', $event)"
    />
  </div>
</template>

<script setup>
import BaseButton from '@/components/atoms/BaseButton.vue'
import BaseIcon from '@/components/atoms/BaseIcon.vue'
import BaseText from '@/components/atoms/BaseText.vue'

defineProps({
  selectedFileName: { type: String, required: true },
  fileInput: { type: Object, default: null },
})

defineEmits(['export', 'select-import', 'confirm-import', 'cancel-import', 'handle-file-change'])
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

.hidden-file-input {
  display: none;
}
</style>
