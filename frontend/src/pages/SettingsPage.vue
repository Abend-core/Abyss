<script setup>
import { computed } from 'vue'
import { useSettingsPage } from '@/composables/useSettingsPage.js'
import BaseText from '@/components/atoms/BaseText.vue'
import SettingsCurrency from '@/components/pages/settings/SettingsCurrency.vue'
import SettingsDataManagement from '@/components/pages/settings/SettingsDataManagement.vue'
import SettingsDeleteAccount from '@/components/pages/settings/SettingsDeleteAccount.vue'
import SettingsExportPasswordModal from '@/components/pages/settings/SettingsExportPasswordModal.vue'

const page = useSettingsPage()

// Computed properties to expose ref values
const currency = computed(() => page.currency.value)
const currencyOptions = computed(() => page.currencyOptions)
const selectedFileName = computed(() => page.selectedFileName.value)
const fileInput = computed(() => page.fileInput.value)
const showDeleteModal = computed(() => page.showDeleteModal.value)
const showExportPasswordModal = computed(() => page.showExportPasswordModal.value)
const exportPassword = computed(() => page.exportPassword.value)
const isExporting = computed(() => page.isExporting.value)
</script>

<template>
  <div class="settings-page">
    <!-- ── En-tête ────────────────────────────────── -->
    <div class="page-header">
      <div class="page-header__text">
        <BaseText as="h1" size="2xl" weight="bold">Paramètres</BaseText>
        <BaseText color="secondary" size="sm">Gérez votre compte et vos préférences</BaseText>
      </div>
    </div>

    <!-- ── Devise ──────────────────────────────────── -->
    <SettingsCurrency
      :currency="currency"
      :currency-options="currencyOptions"
      @update:currency="page.currency.value = $event"
      @save="page.saveCurrency($event)"
    />

    <!-- ── Gestion des données ────────────────────── -->
    <SettingsDataManagement
      :selected-file-name="selectedFileName"
      :file-input="fileInput"
      @export="page.exportData()"
      @select-import="page.selectImportFile()"
      @confirm-import="page.confirmImport()"
      @cancel-import="page.cancelImport()"
      @handle-file-change="page.handleFileChange"
    />

    <!-- ── Zone de danger ─────────────────────────── -->
    <SettingsDeleteAccount
      :show-delete-modal="showDeleteModal"
      @delete="page.showDeleteModal.value = true"
      @close="page.showDeleteModal.value = false"
      @confirm-delete="page.confirmDeleteAccount()"
    />

    <!-- ── Modal export mot de passe ──────────────── -->
    <SettingsExportPasswordModal
      :show-export-password-modal="showExportPasswordModal"
      :export-password="exportPassword"
      :is-exporting="isExporting"
      @update:exportPassword="page.exportPassword.value = $event"
      @close="page.cancelExport()"
      @confirm="page.confirmExport()"
    />
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-5) var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* Mobile - espace pour le bouton flottant */
@media (max-width: 767px) {
  .settings-page {
    padding-bottom: calc(var(--space-5) + 4.5rem);
  }
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.page-header__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>
